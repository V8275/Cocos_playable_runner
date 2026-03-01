import { _decorator, Component, Node, input, Input, Animation, tween, Vec3, Collider2D, Contact2DType, IPhysics2DContact, RigidBody2D, Sprite, Color } from 'cc';
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
    private animation: Animation = null;
    private collider: Collider2D = null;
    private rigidBody: RigidBody2D = null;
    private sprite: Sprite = null;
    private isInvincible: boolean = false;
    private originalColor: Color = new Color();
    private gameManager: any = null;

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
        }

        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);

        this.node.setPosition(this.node.position.x, this.groundY, this.node.position.z);

        this.playWalkAnimation();
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);

        if (this.collider) {
            this.collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
        this.unscheduleAllCallbacks();
    }

    onTouchStart(event: any) {
        if (this.gameManager && this.gameManager.isGameOver) {
            return;
        }

        if (!this.isJumping) {
            this.jump();
        }
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if (this.isJumping && otherCollider.node.name !== 'Obstacle') {
            this.isJumping = false;
            this.playWalkAnimation();
        }
    }

    playWalkAnimation() {
        if (this.gameManager && this.gameManager.isGameOver) {
            return;
        }

        if (this.animation) {
            const clips = this.animation.clips;
            if (clips.length > 0) {
                this.animation.play(clips[1].name);
            }
        }
    }

    playJumpAnimation() {
        if (this.gameManager && this.gameManager.isGameOver) {
            return;
        }

        if (this.animation) {
            const clips = this.animation.clips;
            if (clips.length > 1) {
                this.animation.play(clips[0].name);
            }
        }
    }

    jump() {
        if (this.isJumping) return;

        this.isJumping = true;
        this.playJumpAnimation();

        const originalPos = this.node.position.clone();
        const jumpUpPos = new Vec3(originalPos.x, originalPos.y + this.jumpHeight, originalPos.z);

        tween(this.node)
            .to(this.jumpDuration, { position: jumpUpPos }, { easing: 'sineOut' })
            .to(this.jumpDuration, { position: originalPos }, {
                easing: 'sineIn',
                onComplete: () => {
                    this.isJumping = false;
                    this.playWalkAnimation();
                }
            })
            .start();
    }

    public applyDamage() {
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
        return !this.isJumping;
    }
}