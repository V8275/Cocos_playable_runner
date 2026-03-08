import { _decorator, Component, Node, Label, Prefab, instantiate, CCInteger, PhysicsSystem2D, Vec2, RigidBody2D, director, AudioSource, Animation, Vec3, UITransform, tween, game, Color } from 'cc';
import { Coin } from "./Coin";
import { Obstacle } from "./Obstacle";
import { Player } from "./Player";
import { ScrollingBackground } from "./ScrollingBackground";
import { FloatingText } from "./FloatingText";
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property({
        type: Node,
        tooltip: "Player"
    })
    public player: Node = null;

    @property({
        type: [Prefab],
        tooltip: "Obstacle Prefabs Array - разные препятствия"
    })
    public obstaclePrefabs: Prefab[] = [];

    @property({
        type: Prefab,
        tooltip: "Money Prefab"
    })
    public coinPrefab: Prefab = null;

    @property({
        type: Node,
        tooltip: "Object Container"
    })
    public objectContainer: Node = null;

    @property({
        type: Label,
        tooltip: "Score Label"
    })
    public scoreLabel: Label = null;

    @property({
        type: [Node],
        tooltip: "HP Array"
    })
    public heartNodes: Node[] = [];

    @property({
        type: Node,
        tooltip: "Lose Warning"
    })
    public gameOverMessageNode: Node = null;

    @property({
        type: Node,
        tooltip: "Lose Menu"
    })
    public gameOverMenuNode: Node = null;

    @property({
        type: Node,
        tooltip: "Win Menu"
    })
    public winMenuNode: Node = null;

    @property({
        type: Label,
        tooltip: "Total Score Label"
    })
    public finalScoreLabel: Label = null;

    @property({
        type: Label,
        tooltip: "Win Total Score Label"
    })
    public winFinalScoreLabel: Label = null;

    @property({
        type: CCInteger,
        tooltip: "Obstacle Height"
    })
    public obstacleY: number = -200;

    @property({
        type: CCInteger,
        tooltip: "Obstacle Spawn Point"
    })
    public obstacleX: number = 500;

    @property({
        type: CCInteger,
        tooltip: "Objects Speed"
    })
    public moveSpeed: number = 300;

    @property({
        type: CCInteger,
        tooltip: "Lose Warning Showtime"
    })
    public messageDuration: number = 2;

    @property({
        type: CCInteger,
        tooltip: "Coin Offset"
    })
    public CoinOffset: number = 200;

    @property({
        type: AudioSource,
        tooltip: "coin sound"
    })
    public coinSound: AudioSource = null;

    @property({
        type: ScrollingBackground,
        tooltip: "Scrolling Background Reference"
    })
    public scrollingBackground: ScrollingBackground = null;

    @property({
        type: CCInteger,
        tooltip: "Time to win in seconds"
    })
    public winTime: number = 60;

    @property({
        type: Vec3,
        tooltip: "Target position for flying coin (right top corner)"
    })
    public coinTargetPosition: Vec3 = new Vec3(400, 300, 0);

    @property({
        type: Number,
        tooltip: "Flying coin scale at the end"
    })
    public coinEndScale: number = 0.5;

    @property({
        type: Prefab,
        tooltip: "Flying Coin Prefab (optional - if you want separate visual)"
    })
    public flyingCoinPrefab: Prefab = null;

    @property({
        type: Prefab,
        tooltip: "Floating Text Prefab - появляется при сборе монеты"
    })
    public floatingTextPrefab: Prefab = null;

    private score: number = 0;
    private lives: number = 3;
    public isGameOver: boolean = false;
    public isGameWin: boolean = false;
    private spawnTimer: number = 0;
    private minSpawnTime: number = 2.0;
    private maxSpawnTime: number = 3.5;
    private screenLeftBoundary: number = -800;
    private gameTime: number = 0;
    private currentSpeed: number = 0;
    private lastDeltaTime: number = 0;
    private speedCheckTimer: number = 0;

    start() {
        this.updateUI();
        this.startSpawning();

        PhysicsSystem2D.instance.enable = true;
        this.currentSpeed = this.moveSpeed;

        if (!this.obstaclePrefabs || this.obstaclePrefabs.length === 0) {
            console.error("No obstacle prefabs assigned! Please add at least one obstacle prefab.");
        }

        if (!this.floatingTextPrefab) {
            console.warn("FloatingText prefab not assigned! Floating text will not appear.");
        }

        if (this.gameOverMessageNode) {
            this.gameOverMessageNode.active = false;
        }
        if (this.gameOverMenuNode) {
            this.gameOverMenuNode.active = false;
        }
        if (this.winMenuNode) {
            this.winMenuNode.active = false;
        }

        if (!this.scrollingBackground) {
            this.scrollingBackground = this.node.getComponentInChildren(ScrollingBackground);
            if (!this.scrollingBackground) {
                console.warn("ScrollingBackground not found! Please assign it in the inspector.");
            }
        }

        this.gameTime = 0;
        this.isGameWin = false;

        this.speedCheckTimer = 0;
    }

    update(deltaTime: number) {
        if (this.isGameOver || this.isGameWin) return;

        this.lastDeltaTime = deltaTime;
        this.speedCheckTimer += deltaTime;

        if (this.speedCheckTimer >= 5.0) {
            this.checkGameSpeed();
            this.speedCheckTimer = 0;
        }

        this.gameTime += deltaTime;

        if (this.gameTime >= this.winTime && !this.isGameWin && !this.isGameOver) {
            this.gameWin();
            return;
        }

        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0) {
            this.spawnObject();
            this.resetSpawnTimer();
        }

        this.updateObjectsSpeed();

        const objects = this.objectContainer.children;
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];

            if (obj.position.x < this.screenLeftBoundary) {
                obj.destroy();
            }
        }
    }

    private checkGameSpeed() {
        if (this.lastDeltaTime > 0.05) {
            console.warn(`Game slowdown detected! DeltaTime: ${this.lastDeltaTime}`);
            this.forceUpdateAllVelocities();
        }
    }

    private forceUpdateAllVelocities() {
        const objects = this.objectContainer.children;
        for (let i = 0; i < objects.length; i++) {
            const obj = objects[i];
            const rigidBody = obj.getComponent(RigidBody2D);
            if (rigidBody) {
                const currentVel = rigidBody.linearVelocity;
                if (Math.abs(currentVel.x) < this.moveSpeed * 0.5) {
                    rigidBody.linearVelocity = new Vec2(-this.moveSpeed, currentVel.y);
                }
            }
        }
    }

    private updateObjectsSpeed() {
        const objects = this.objectContainer.children;
        for (let i = 0; i < objects.length; i++) {
            const obj = objects[i];
            const rigidBody = obj.getComponent(RigidBody2D);
            if (rigidBody) {
                const currentVel = rigidBody.linearVelocity;
                const targetVelX = -this.moveSpeed;
                const newVelX = currentVel.x + (targetVelX - currentVel.x) * 0.1;
                rigidBody.linearVelocity = new Vec2(newVelX, currentVel.y);
            }
        }
    }

    spawnObject() {
        if (Math.random() < 0.5) {
            this.spawnObstacle();
        } else {
            this.spawnCoin();
        }
    }

    spawnObstacle() {
        if (!this.obstaclePrefabs || this.obstaclePrefabs.length === 0) {
            console.warn("No obstacle prefabs available to spawn!");
            return;
        }

        const randomIndex = Math.floor(Math.random() * this.obstaclePrefabs.length);
        const obstaclePrefab = this.obstaclePrefabs[randomIndex];

        if (!obstaclePrefab) {
            console.warn("Selected obstacle prefab is null!");
            return;
        }

        const obstacle = instantiate(obstaclePrefab);
        obstacle.setParent(this.objectContainer);
        obstacle.setPosition(this.obstacleX, this.obstacleY, 0);

        let obstacleComp = obstacle.getComponent(Obstacle);
        if (!obstacleComp) {
            obstacleComp = obstacle.addComponent(Obstacle);
        }
        obstacleComp.gameManager = this;

        const rigidBody = obstacle.getComponent(RigidBody2D);
        if (rigidBody) {
            rigidBody.linearVelocity = new Vec2(-this.moveSpeed, 0);
            rigidBody.gravityScale = 0;
        }

        console.log(`Spawned obstacle: ${obstaclePrefab.name}`);
    }

    spawnCoin() {
        const isArcFormation = Math.random() < 0.3;

        let startX = this.obstacleX;

        if (isArcFormation) {
            const baseY = this.obstacleY;
            const arcHeight = 200;

            for (let i = 0; i < 3; i++) {
                const coin = instantiate(this.coinPrefab);
                coin.setParent(this.objectContainer);

                let posY = baseY;
                if (i === 1) {
                    posY = baseY + arcHeight;
                }

                coin.setPosition(startX, posY, 0);

                let coinComp = coin.getComponent(Coin);
                if (!coinComp) {
                    coinComp = coin.addComponent(Coin);
                }
                coinComp.gameManager = this;

                const rigidBody = coin.getComponent(RigidBody2D);
                if (rigidBody) {
                    rigidBody.linearVelocity = new Vec2(-this.moveSpeed, 0);
                    rigidBody.gravityScale = 0;
                }

                startX = coin.getPosition().x + this.CoinOffset - 10;
            }
        } else {
            for (let i = 0; i < 3; i++) {
                const coin = instantiate(this.coinPrefab);
                coin.setParent(this.objectContainer);
                coin.setPosition(startX, this.obstacleY, 0);

                let coinComp = coin.getComponent(Coin);
                if (!coinComp) {
                    coinComp = coin.addComponent(Coin);
                }
                coinComp.gameManager = this;

                const rigidBody = coin.getComponent(RigidBody2D);
                if (rigidBody) {
                    rigidBody.linearVelocity = new Vec2(-this.moveSpeed, 0);
                    rigidBody.gravityScale = 0;
                }
                startX = coin.getPosition().x + this.CoinOffset;
            }
        }
    }

    resetSpawnTimer() {
        this.spawnTimer = this.minSpawnTime + Math.random() * (this.maxSpawnTime - this.minSpawnTime);
    }

    startSpawning() {
        this.resetSpawnTimer();
    }

    addScore(points: number, coinWorldPosition?: Vec3) {
        this.score += points;
        this.playCoinSound();

        if (coinWorldPosition) {
            this.createFlyingCoin(coinWorldPosition);

            if (Math.random() < 0.5) {
                this.spawnFloatingText(
                    coinWorldPosition,
                    `+${points}`,
                    Color.YELLOW
                );
            }
        }

        this.updateUI();
    }

    public playCoinSound() {
        if (this.coinSound) {
            this.coinSound.playOneShot(this.coinSound.clip, 1.0);
        }
    }

    private createFlyingCoin(worldPos: Vec3) {
        const prefabToUse = this.flyingCoinPrefab || this.coinPrefab;

        if (!prefabToUse) {
            console.warn("No coin prefab assigned for animation!");
            return;
        }

        const flyingCoin = instantiate(prefabToUse);

        flyingCoin.active = false;
        flyingCoin.setParent(this.node);
        const componentsToRemove = [];

        const rigidBody = flyingCoin.getComponent(RigidBody2D);
        if (rigidBody) {
            componentsToRemove.push(rigidBody);
        }

        const colliders = flyingCoin.getComponents(Component).filter(comp =>
            comp.name.includes('Collider2D') || comp.name.includes('BoxCollider2D') ||
            comp.name.includes('CircleCollider2D') || comp.name.includes('PolygonCollider2D')
        );

        componentsToRemove.push(...colliders);

        componentsToRemove.forEach(comp => {
            if (comp && comp.destroy) {
                comp.destroy();
            }
        });

        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) {
            console.warn("UITransform not found on GameManager node!");
            flyingCoin.destroy();
            return;
        }

        const localPos = uiTransform.convertToNodeSpaceAR(worldPos);

        flyingCoin.active = true;
        flyingCoin.setPosition(localPos);

        const startScale = flyingCoin.scale.clone();

        tween(flyingCoin).stop();

        tween(flyingCoin)
            .to(0.3, {
                position: new Vec3(localPos.x, localPos.y + 150, localPos.z),
                scale: new Vec3(startScale.x * 1.2, startScale.y * 1.2, startScale.z)
            }, {
                easing: 'sineOut'
            })
            .to(0.5, {
                position: this.coinTargetPosition,
                scale: new Vec3(startScale.x * this.coinEndScale, startScale.y * this.coinEndScale, startScale.z)
            }, {
                easing: 'sineIn',
                onComplete: () => {
                    flyingCoin.destroy();
                }
            })
            .start();
    }

    private spawnFloatingText(worldPos: Vec3, text: string, color: Color = Color.YELLOW) {
        if (!this.floatingTextPrefab) {
            console.warn("FloatingText prefab not assigned!");
            return;
        }

        const floatingText = instantiate(this.floatingTextPrefab);

        floatingText.setParent(this.node);

        const floatingTextComp = floatingText.getComponent(FloatingText);
        if (!floatingTextComp) {
            console.warn("FloatingText component not found on prefab!");
            floatingText.destroy();
            return;
        }

        const uiTransform = this.node.getComponent(UITransform);
        if (uiTransform) {
            const localPos = uiTransform.convertToNodeSpaceAR(worldPos);
            floatingText.setPosition(localPos);
        } else {
            floatingText.setPosition(worldPos);
        }

        floatingTextComp.setColor(color);

        floatingText.active = true;
    }

    takeDamage() {
        this.lives--;
        if (this.player) {
            const playerComp = this.player.getComponent(Player);
            if (playerComp) {
                playerComp.applyDamage();
            }
        }
        this.updateUI();

        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    gameWin() {
        if (this.isGameWin || this.isGameOver) return;

        this.isGameWin = true;

        if (this.scrollingBackground) {
            this.scrollingBackground.stopScrolling();
        }

        const objects = this.objectContainer.children;
        for (let i = 0; i < objects.length; i++) {
            const obj = objects[i];
            const rigidBody = obj.getComponent(RigidBody2D);
            if (rigidBody) {
                rigidBody.linearVelocity = new Vec2(0, 0);
                rigidBody.enabled = false;
            }

            const animation = obj.getComponent(Animation);
            if (animation) {
                animation.stop();
            }
        }

        this.stopPlayerMovement();

        if (this.winMenuNode) {
            this.winMenuNode.active = true;
            if (this.winFinalScoreLabel) {
                this.winFinalScoreLabel.string = `Total Score: ${this.score}`;
            }
        }

        console.log("Game Win! Time reached:", this.winTime, "seconds");
    }

    gameOver() {
        if (this.isGameOver || this.isGameWin) return;

        this.isGameOver = true;

        if (this.scrollingBackground) {
            this.scrollingBackground.stopScrolling();
        }

        const objects = this.objectContainer.children;
        for (let i = 0; i < objects.length; i++) {
            const obj = objects[i];
            const rigidBody = obj.getComponent(RigidBody2D);
            if (rigidBody) {
                rigidBody.linearVelocity = new Vec2(0, 0);
                rigidBody.enabled = false;
            }

            const animation = obj.getComponent(Animation);
            if (animation) {
                animation.stop();
            }
        }

        this.stopPlayerMovement();

        if (this.gameOverMessageNode) {
            this.gameOverMessageNode.active = true;
        }

        this.scheduleOnce(() => {
            if (this.gameOverMessageNode) {
                this.gameOverMessageNode.active = false;
            }
            if (this.gameOverMenuNode) {
                this.gameOverMenuNode.active = true;
                if (this.finalScoreLabel) {
                    this.finalScoreLabel.string = `Total Score: ${this.score}`;
                }
            }
        }, this.messageDuration);
    }

    private stopPlayerMovement() {
        if (this.player) {
            const playerAnimation = this.player.getComponent(Animation);
            if (playerAnimation) {
                playerAnimation.stop();
            }

            const playerComponent = this.player.getComponent(Player);
            if (playerComponent) {
                tween(this.player).stop();

                const currentPos = this.player.position.clone();
                this.player.setPosition(currentPos.x, currentPos.y, currentPos.z);

                const rigidBody = this.player.getComponent(RigidBody2D);
                if (rigidBody) {
                    rigidBody.linearVelocity = new Vec2(0, 0);
                    rigidBody.enabled = false;
                }
            }
        }
    }

    updateUI() {
        if (this.scoreLabel) {
            this.scoreLabel.string = `Score: ${this.score}`;
        }

        if (this.heartNodes && this.heartNodes.length > 0) {
            for (let i = 0; i < this.heartNodes.length; i++) {
                if (this.heartNodes[i]) {
                    this.heartNodes[i].active = i < this.lives;
                }
            }
        }
    }

    public restartGame() {
        window.open('https://play.google.com/store/apps;?hl=ru&pli=1', '_blank');
        //director.loadScene(director.getScene().name);
    }

    public getRemainingTime(): number {
        return Math.max(0, this.winTime - this.gameTime);
    }
}