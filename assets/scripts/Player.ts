import { _decorator, Component, Node, input, Input, KeyCode, Animation, tween, Vec3, Collider2D, Contact2DType, IPhysics2DContact, RigidBody2D, ERigidBody2DType } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Player')
export class Player extends Component {
    @property
    public jumpHeight: number = 150;
    @property
    public jumpDuration: number = 0.3;
    @property
    public groundY: number = -200;

    private isJumping: boolean = false;
    private animation: Animation = null;
    private collider: Collider2D = null;
    private rigidBody: RigidBody2D = null;

    start() {
        this.animation = this.getComponent(Animation);
        this.rigidBody = this.getComponent(RigidBody2D);
        
        this.collider = this.getComponent(Collider2D);
        if (this.collider) {
            this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }

        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        this.node.setPosition(this.node.position.x, this.groundY, this.node.position.z);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        if (this.collider) {
            this.collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
    }

    onKeyDown(event: any) {
        if (event.keyCode === KeyCode.SPACE && !this.isJumping) {
            this.jump();
        }
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
    }

    jump() {
        this.isJumping = true;
        const originalPos = this.node.position.clone();
        const jumpUpPos = new Vec3(originalPos.x, originalPos.y + this.jumpHeight, originalPos.z);

        tween(this.node)
            .to(this.jumpDuration, { position: jumpUpPos }, { easing: 'sineOut' })
            .to(this.jumpDuration, { position: originalPos }, {
                easing: 'sineIn',
                onComplete: () => {
                    this.isJumping = false;
                }
            })
            .start();
    }

    public isOnGround(): boolean {
        return !this.isJumping;
    }
}