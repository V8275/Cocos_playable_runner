import { _decorator, Component, Node, Label, Prefab, instantiate, CCInteger, PhysicsSystem2D, Vec2, RigidBody2D, director } from 'cc';
import { Coin } from "./Coin";
import { Obstacle } from "./Obstacle";
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property({
        type: Node,
        tooltip: "Player"
    })
    public player: Node = null;

    @property({
        type: Prefab,
        tooltip: "Obstacle Prefab"
    })
    public obstaclePrefab: Prefab = null;

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
        type: Label,
        tooltip: "Total Score Label"
    })
    public finalScoreLabel: Label = null;

    @property({
        type: CCInteger,
        tooltip: "Obstacle Height"
    })
    public obstacleY: number = -200;

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

    private score: number = 0;
    private lives: number = 3;
    private isGameOver: boolean = false;
    private spawnTimer: number = 0;
    private minSpawnTime: number = 1.0;
    private maxSpawnTime: number = 2.5;
    private screenLeftBoundary: number = -800;

    start() {
        this.updateUI();
        this.startSpawning();

        PhysicsSystem2D.instance.enable = true;

        if (this.gameOverMessageNode) {
            this.gameOverMessageNode.active = false;
        }
        if (this.gameOverMenuNode) {
            this.gameOverMenuNode.active = false;
        }
    }

    update(deltaTime: number) {
        if (this.isGameOver) return;

        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0) {
            this.spawnObject();
            this.resetSpawnTimer();
        }

        const objects = this.objectContainer.children;
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];

            if (obj.position.x < this.screenLeftBoundary) {
                obj.destroy();
            }
        }
    }

    spawnObject() {
        if (Math.random() < 0.6) {
            this.spawnObstacle();
        } else {
            this.spawnCoin();
        }
    }

    spawnObstacle() {
        const obstacle = instantiate(this.obstaclePrefab);
        obstacle.setParent(this.objectContainer);

        const startX = 500;
        obstacle.setPosition(startX, this.obstacleY, 0);

        let obstacleComp = obstacle.getComponent(Obstacle);
        if (!obstacleComp) {
            obstacleComp = obstacle.addComponent(Obstacle);
        }
        obstacleComp.gameManager = this;

        const rigidBody = obstacle.getComponent(RigidBody2D);
        if (rigidBody) {
            rigidBody.linearVelocity = new Vec2(-this.moveSpeed, 0);
        }
    }

    spawnCoin() {
        const coin = instantiate(this.coinPrefab);
        coin.setParent(this.objectContainer);

        const startX = 500;
        coin.setPosition(startX, this.obstacleY, 0);

        let coinComp = coin.getComponent(Coin);
        if (!coinComp) {
            coinComp = coin.addComponent(Coin);
        }
        coinComp.gameManager = this;

        const rigidBody = coin.getComponent(RigidBody2D);
        if (rigidBody) {
            rigidBody.linearVelocity = new Vec2(-this.moveSpeed, 0);
        }
    }

    resetSpawnTimer() {
        this.spawnTimer = this.minSpawnTime + Math.random() * (this.maxSpawnTime - this.minSpawnTime);
    }

    startSpawning() {
        this.resetSpawnTimer();
    }

    addScore(points: number) {
        this.score += points;
        this.updateUI();
    }

    takeDamage() {
        this.lives--;
        this.updateUI();

        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.isGameOver = true;

        const objects = this.objectContainer.children;
        for (let i = 0; i < objects.length; i++) {
            const obj = objects[i];
            const rigidBody = obj.getComponent(RigidBody2D);
            if (rigidBody) {
                rigidBody.linearVelocity = new Vec2(0, 0);
            }
        }

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
        director.loadScene(director.getScene().name);
    }
}