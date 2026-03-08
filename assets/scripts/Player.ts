import { _decorator, Component, Node, input, Input, Animation, tween, Vec3, Collider2D, Contact2DType, IPhysics2DContact, RigidBody2D, Sprite, Color, game } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Player')
export class Player extends Component {
    @property
    public jumpHeight: number = 150;
    @property
    public jumpDuration: number = 0.3;
    @property
    public groundY: number = -200;
    @property
    public invincibilityDuration: number = 2;

    private isJumping: boolean = false;
    private canJump: boolean = true;
    private isGrounded: boolean = true;
    private animation: Animation = null;
    private collider: Collider2D = null;
    private rigidBody: RigidBody2D = null;
    private sprite: Sprite = null;
    private isInvincible: boolean = false;
    private originalColor: Color = new Color();
    private gameManager: any = null;
    private groundContactCount: number = 0;
    private currentTween: any = null;
    private jumpStartTime: number = 0;

    start() {
        this.animation = this.getComponent(Animation);
        this.rigidBody = this.getComponent(RigidBody2D);
        this.sprite = this.getComponent(Sprite);
        this.gameManager = this.node.parent?.getComponent('GameManager');

        if (this.sprite) {
            this.originalColor = this.sprite.color.clone();
        }

        this.collider = this.getComponent(Collider2D);
        if (this.collider) {
            this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            this.collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        }

        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);

        this.node.setPosition(this.node.position.x, this.groundY, this.node.position.z);

        this.playWalkAnimation();

    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);

        if (this.collider) {
            this.collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            this.collider.off(Contact2DType.END_CONTACT, this.onEndContact, this);
        }

        if (this.currentTween) {
            this.currentTween.stop();
        }

        this.unscheduleAllCallbacks();
    }

    onTouchStart(event: any) {
        if (this.gameManager && this.gameManager.isGameOver) {
            return;
        }

        if (this.isGrounded && !this.isJumping && this.canJump) {
            this.jump();
        }
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if (otherCollider.node.name === 'Ground' || otherCollider.tag === 1) {
            this.groundContactCount++;

            if (this.isJumping && this.groundContactCount > 0) {
                this.landOnGround();
            }
        }
    }

    onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if (otherCollider.node.name === 'Ground' || otherCollider.tag === 1) {
            this.groundContactCount = Math.max(0, this.groundContactCount - 1);
            this.isGrounded = this.groundContactCount > 0;
        }
    }

    landOnGround() {
        this.isJumping = false;
        this.isGrounded = true;
        this.canJump = true;
        this.playWalkAnimation();

        const pos = this.node.position;
        if (Math.abs(pos.y - this.groundY) > 1) {
            this.node.setPosition(pos.x, this.groundY, pos.z);
        }

        this.jumpStartTime = 0;
    }

    playWalkAnimation() {
        if (this.gameManager && this.gameManager.isGameOver) {
            return;
        }

        if (this.animation) {
            const clips = this.animation.clips;
            if (clips.length > 0) {
                const walkClip = clips.length > 1 ? clips[1] : clips[0];
                this.animation.play(walkClip.name);
            }
        }
    }

    playJumpAnimation() {
        if (this.gameManager && this.gameManager.isGameOver) {
            return;
        }

        if (this.animation) {
            const clips = this.animation.clips;
            if (clips.length > 0) {
                this.animation.play(clips[0].name);
            }
        }
    }

    jump() {
        if (this.isJumping || !this.isGrounded || !this.canJump) return;

        this.isJumping = true;
        this.isGrounded = false;
        this.canJump = false;
        this.playJumpAnimation();

        this.jumpStartTime = performance.now() / 1000;

        const originalPos = this.node.position.clone();
        const jumpUpPos = new Vec3(originalPos.x, originalPos.y + this.jumpHeight, originalPos.z);

        if (this.currentTween) {
            this.currentTween.stop();
        }

        this.currentTween = tween(this.node)
            .to(this.jumpDuration, { position: jumpUpPos }, {
                easing: 'sineOut',
                onUpdate: (target: Node, ratio: number) => {
                    if (this.node.position.y > jumpUpPos.y + 10) {
                        this.node.setPosition(this.node.position.x, jumpUpPos.y, this.node.position.z);
                    }
                }
            })
            .to(this.jumpDuration, { position: originalPos }, {
                easing: 'sineIn',
                onUpdate: (target: Node, ratio: number) => {
                    if (this.node.position.y < this.groundY - 10) {
                        this.node.setPosition(this.node.position.x, this.groundY, this.node.position.z);
                    }
                },
                onComplete: () => {
                    this.scheduleOnce(() => {
                        if (this.isJumping) {
                            this.landOnGround();
                        }
                    }, 0.1);
                    this.currentTween = null;
                }
            })
            .start();
    }

    public applyDamage() {
        if (this.isInvincible) return false;

        this.makeInvincible();
        return true;
    }

    private makeInvincible() {
        this.isInvincible = true;
        this.startFlashing();

        this.scheduleOnce(() => {
            this.isInvincible = false;
            this.stopFlashing();
        }, this.invincibilityDuration);
    }

    private startFlashing() {
        this.unschedule(this.flash);
        this.schedule(this.flash, 0.1);
    }

    private stopFlashing() {
        this.unschedule(this.flash);
        if (this.sprite) {
            this.sprite.color = this.originalColor;
        }
    }

    private flash() {
        if (!this.sprite) return;

        if (this.sprite.color.equals(Color.RED)) {
            this.sprite.color = this.originalColor;
        } else {
            this.sprite.color = Color.RED;
        }
    }

    public isOnGround(): boolean {
        return this.isGrounded;
    }

    public resetGroundY(value: number) {
        this.groundY = value;
        if (this.isGrounded && !this.isJumping) {
            const pos = this.node.position;
            this.node.setPosition(pos.x, this.groundY, pos.z);
        }
    }

    public forceLand() {
        if (this.isJumping) {
            if (this.currentTween) {
                this.currentTween.stop();
                this.currentTween = null;
            }
            this.landOnGround();
        }
    }
}