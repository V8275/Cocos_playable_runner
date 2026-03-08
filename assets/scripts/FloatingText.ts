import { _decorator, Component, Node, Label, tween, Vec3, Color, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FloatingText')
export class FloatingText extends Component {
    @property({
        type: Label,
        tooltip: "Label component для отображения текста"
    })
    public textLabel: Label = null;

    @property({
        tooltip: "anim duration"
    })
    public animationDuration: number = 1.5;

    @property({
        tooltip: "Height Text offset"
    })
    public floatHeight: number = 150;

    @property({
        tooltip: "Start Alpha (0-255)"
    })
    public startOpacity: number = 255;

    @property({
        tooltip: "End alpha (0-255)"
    })
    public endOpacity: number = 0;

    @property({
        type: Color,
        tooltip: "text color"
    })
    public textColor: Color = Color.YELLOW;

    @property({
        tooltip: "font size"
    })
    public fontSize: number = 40;

    private startPosition: Vec3 = new Vec3();

    onLoad() {
        if (!this.textLabel) {
            this.textLabel = this.getComponent(Label);
        }

        if (this.textLabel) {
            this.textLabel.fontSize = this.fontSize;
            this.textLabel.color = this.textColor;
            
            const color = this.textLabel.color;
            color.a = this.startOpacity / 255;
            this.textLabel.color = color;
        }

        this.startPosition = this.node.position.clone();
    }

    start() {
        this.playFloatAnimation();
    }

    private playFloatAnimation() {
        const targetPos = new Vec3(
            this.startPosition.x,
            this.startPosition.y + this.floatHeight,
            this.startPosition.z
        );

        tween(this.node)
            .to(this.animationDuration, {
                position: targetPos
            }, {
                easing: 'sineOut',
                onUpdate: (target: Node, ratio: number) => {
                    if (this.textLabel) {
                        const color = this.textLabel.color;
                        const alpha = this.startOpacity + (this.endOpacity - this.startOpacity) * ratio;
                        color.a = alpha / 255;
                        this.textLabel.color = color;
                    }
                }
            })
            .call(() => {
                this.node.destroy();
            })
            .start();
    }

    public setColor(color: Color) {
        if (this.textLabel) {
            this.textLabel.color = color;
        }
    }

    public setFontSize(size: number) {
        if (this.textLabel) {
            this.textLabel.fontSize = size;
        }
    }
}