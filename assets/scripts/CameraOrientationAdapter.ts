import { _decorator, Component, Camera, screen, macro, log, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraOrientationAdapter')
export class CameraOrientationAdapter extends Component {

    @property(Camera)
    public gameCamera: Camera = null;

    @property({
        tooltip: "Сколько видно по высоте в портретном режиме"
    })
    public portraitVisibleHeight: number = 12;

    @property({
        tooltip: "Смещение камеры по X в портретном режиме"
    })
    public portraitOffsetX: number = 0;

    @property({
        tooltip: "Смещение камеры по Y в портретном режиме"
    })
    public portraitOffsetY: number = 0;

    @property({
        tooltip: "Сколько видно по ширине в портретном режиме"
    })
    public portraitVisibleWidth: number = 0;

    @property({
        tooltip: "Сколько видно по высоте в альбомном режиме"
    })
    public landscapeVisibleHeight: number = 8;

    @property({
        tooltip: "Смещение камеры по X в альбомном режиме"
    })
    public landscapeOffsetX: number = 0;

    @property({
        tooltip: "Смещение камеры по Y в альбомном режиме"
    })
    public landscapeOffsetY: number = 0;

    @property({
        tooltip: "Сколько видно по ширине в альбомном режиме"
    })
    public landscapeVisibleWidth: number = 0;

    private originalPosition: Vec3 = new Vec3();

    onLoad() {
        if (!this.gameCamera) {
            return;
        }

        this.gameCamera.node.getPosition(this.originalPosition);

        screen.on('window-resize', this.onWindowResize, this);
        screen.on('orientation-change', this.onOrientationChange, this);

        this.adaptCamera();
    }

    onDestroy() {
        screen.off('window-resize', this.onWindowResize, this);
        screen.off('orientation-change', this.onOrientationChange, this);
    }

    private onWindowResize() {
        this.adaptCamera();
    }

    private onOrientationChange(orientation: number) {
        this.adaptCamera();
    }

    private adaptCamera() {
        const windowSize = screen.windowSize;
        const isLandscape = windowSize.width > windowSize.height;

        const screenAspect = windowSize.width / windowSize.height;

        log(`screensize: ${windowSize.width} x ${windowSize.height}, Aspect: ${screenAspect}`);

        if (isLandscape) {
            this.gameCamera.orthoHeight = this.landscapeVisibleHeight;

            this.landscapeVisibleWidth = this.landscapeVisibleHeight * screenAspect;

            const newPosition = new Vec3(
                this.originalPosition.x + this.landscapeOffsetX,
                this.originalPosition.y + this.landscapeOffsetY,
                this.originalPosition.z
            );
            this.gameCamera.node.setPosition(newPosition);

            log(`Альбом: высота = ${this.landscapeVisibleHeight}, ширина = ${this.landscapeVisibleWidth}, позиция X = ${newPosition.x}`);
        } else {
            this.gameCamera.orthoHeight = this.portraitVisibleHeight;

            this.portraitVisibleWidth = this.portraitVisibleHeight * screenAspect;
            log(`Портрет: высота = ${this.portraitVisibleHeight}, ширина = ${this.portraitVisibleWidth}`);
            const newPosition = new Vec3(
                this.originalPosition.x + this.portraitOffsetX,
                this.originalPosition.y + this.portraitOffsetY,
                this.originalPosition.z
            );
            this.gameCamera.node.setPosition(newPosition);

            log(`Портрет: высота = ${this.portraitVisibleHeight}, ширина = ${this.portraitVisibleWidth}, позиция X = ${newPosition.x}`);
        }
    }
}