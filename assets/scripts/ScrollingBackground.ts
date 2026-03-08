import { _decorator, Component, Node, Sprite, UITransform, Vec3, CCInteger, game } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScrollingBackground')
export class ScrollingBackground extends Component {
    @property({
        type: Node,
        tooltip: "Background node 1"
    })
    public background1: Node = null;

    @property({
        type: Node,
        tooltip: "Background node 2"
    })
    public background2: Node = null;

    @property({
        type: Number,
        tooltip: "Scroll speed"
    })
    public scrollSpeed: number = 300;

    @property({
        type: CCInteger,
        tooltip: "Manual reset position (X coordinate where background resets)"
    })
    public resetPositionX: number = -800;

    @property({
        type: CCInteger,
        tooltip: "Manual offset for repositioning (how far to move background when reset)"
    })
    public resetOffset: number = 1600;

    private backgroundWidth: number = 0;
    private initialPos1: Vec3 = new Vec3();
    private initialPos2: Vec3 = new Vec3();
    private gameManager: any = null;
    private isScrolling: boolean = true;
    private lastUpdateTime: number = 0;
    private accumulatedDelta: number = 0;

    start() {
        this.gameManager = this.node.parent?.getComponent('GameManager');

        if (!this.gameManager) {
            const canvas = this.node.parent;
            if (canvas) {
                this.gameManager = canvas.getComponent('GameManager');
            }
        }

        if (this.background1) {
            this.background1.getPosition(this.initialPos1);

            const uiTransform = this.background1.getComponent(UITransform);
            if (uiTransform) {
                this.backgroundWidth = uiTransform.width;
            }
        }

        if (this.background2) {
            this.background2.getPosition(this.initialPos2);

            const uiTransform = this.background2.getComponent(UITransform);
            if (uiTransform && this.backgroundWidth === 0) {
                this.backgroundWidth = uiTransform.width;
            }
        }

        this.lastUpdateTime = performance.now() / 1000;
        console.log(`Background initialized. GameManager found: ${!!this.gameManager}`);
    }

    update(deltaTime: number) {
        if (!this.isScrolling) {
            return;
        }

        if (!this.background1 || !this.background2) return;

        if (deltaTime > 0.1) {
            console.warn(`Large deltaTime detected in background: ${deltaTime}`);
            this.accumulatedDelta += deltaTime;

            if (this.accumulatedDelta >= 0.1) {
                const steps = Math.floor(this.accumulatedDelta / 0.016);
                for (let i = 0; i < steps; i++) {
                    this.moveBackground(0.016);
                }
                this.accumulatedDelta = 0;
            }
        } else {
            this.moveBackground(deltaTime);
        }
    }

    private moveBackground(deltaTime: number) {
        if (this.gameManager && this.gameManager.moveSpeed) {
            const targetSpeed = this.gameManager.moveSpeed;
            this.scrollSpeed += (targetSpeed - this.scrollSpeed) * 0.1;
        }

        const moveDistance = this.scrollSpeed * deltaTime;

        const pos1 = this.background1.position.clone();
        pos1.x -= moveDistance;
        this.background1.setPosition(pos1);

        const pos2 = this.background2.position.clone();
        pos2.x -= moveDistance;
        this.background2.setPosition(pos2);

        if (pos1.x <= this.resetPositionX) {
            this.resetBackground(this.background1, this.background2);
        }

        if (pos2.x <= this.resetPositionX) {
            this.resetBackground(this.background2, this.background1);
        }
    }

    private resetBackground(backgroundToReset: Node, otherBackground: Node) {
        const currentOtherPos = otherBackground.position;
        const bgPos = backgroundToReset.position;

        let newX = currentOtherPos.x + this.resetOffset;
        if (newX <= currentOtherPos.x) {
            newX = currentOtherPos.x + this.backgroundWidth;
        }

        const newPos = new Vec3(newX, bgPos.y, bgPos.z);
        backgroundToReset.setPosition(newPos);
    }

    public stopScrolling() {
        this.isScrolling = false;
        console.log("Background scrolling stopped");
    }

    public startScrolling() {
        this.isScrolling = true;
        console.log("Background scrolling started");
    }

    public resetToInitialPositions() {
        if (this.background1) {
            this.background1.setPosition(this.initialPos1);
        }
        if (this.background2) {
            this.background2.setPosition(this.initialPos2);
        }
        console.log("Reset to initial positions");
    }

    public setResetParameters(resetX: number, offset: number) {
        this.resetPositionX = resetX;
        this.resetOffset = offset;
        console.log(`Reset parameters updated: resetX=${resetX}, offset=${offset}`);
    }

    public getBackgroundPositions(): { pos1: Vec3, pos2: Vec3 } {
        return {
            pos1: this.background1 ? this.background1.position.clone() : new Vec3(),
            pos2: this.background2 ? this.background2.position.clone() : new Vec3()
        };
    }

    public getInitialPositions(): { pos1: Vec3, pos2: Vec3 } {
        return {
            pos1: this.initialPos1.clone(),
            pos2: this.initialPos2.clone()
        };
    }
}