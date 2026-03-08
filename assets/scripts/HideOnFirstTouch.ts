import { _decorator, Component, Node, input, Input } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('HideOnFirstTouch')
export class HideOnFirstTouch extends Component {
    @property({
        type: Node,
        tooltip: "Нода, которая будет выключена при первом нажатии"
    })
    public targetNode: Node = null;

    @property({
        tooltip: "Выключить только один раз (после первого нажатия)"
    })
    public hideOnce: boolean = true;

    private hasBeenHidden: boolean = false;

    onLoad() {
        // Подписываемся на событие касания
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    }

    onDestroy() {
        // Отписываемся от события при уничтожении
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
    }

    private onTouchStart() {
        // Проверяем, нужно ли скрывать
        if (this.hideOnce && this.hasBeenHidden) {
            return;
        }

        // Проверяем, есть ли целевая нода
        if (!this.targetNode) {
            console.warn("HideOnFirstTouch: targetNode не назначен!");
            return;
        }

        // Выключаем ноду
        this.targetNode.active = false;
        this.hasBeenHidden = true;

        console.log("HideOnFirstTouch: нода выключена");
    }

    // Публичный метод для сброса состояния (можно вызвать из другого скрипта)
    public reset() {
        this.hasBeenHidden = false;
        if (this.targetNode) {
            this.targetNode.active = true;
        }
    }

    // Публичный метод для принудительного скрытия
    public hide() {
        if (this.targetNode) {
            this.targetNode.active = false;
            this.hasBeenHidden = true;
        }
    }
}