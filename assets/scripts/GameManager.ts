import { _decorator, Component, Node, Label, Prefab, instantiate, CCInteger, PhysicsSystem2D, Vec2, RigidBody2D, director, AudioSource, AudioClip, Animation, Tween } from 'cc';
import { Coin } from "./Coin";
import { Obstacle } from "./Obstacle";
import {Player} from "db://assets/scripts/Player";
import { ScrollingBackground } from "./ScrollingBackground";
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

    private score: number = 0;
    private lives: number = 3;
    public isGameOver: boolean = false;
    public isGameWin: boolean = false;
    private spawnTimer: number = 0;
    private minSpawnTime: number = 1.0;
    private maxSpawnTime: number = 2.5;
    private screenLeftBoundary: number = -800;
    private gameTime: number = 0;

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
    }

    update(deltaTime: number) {
        if (this.isGameOver || this.isGameWin) return;

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

        const objects = this.objectContainer.children;
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];

            if (obj.position.x < this.screenLeftBoundary) {
                obj.destroy();
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
        const obstacle = instantiate(this.obstaclePrefab);
        obstacle.setParent(this.objectContainer);
        obstacle.name = 'Obstacle';

        const startX = this.obstacleX;
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

    addScore(points: number) {
        this.score += points;
        this.playCoinSound();
        this.updateUI();
    }

    public playCoinSound() {
        if (this.coinSound) {
            this.coinSound.playOneShot(this.coinSound.clip, 1.0);
        }
    }

    takeDamage() {
        this.lives--;
        this.player.getComponent(Player).applyDamage();
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
                Tween.stopAllByTarget(this.player);

                const playerAny = playerComponent as any;
                const groundY = playerAny.groundY || -200;

                const currentPos = this.player.position.clone();
                this.player.setPosition(currentPos.x, groundY, currentPos.z);

                const playerObj = playerComponent as any;
                if (playerObj) {
                    playerObj.isJumping = false;
                    playerObj.isGrounded = false;
                    playerObj.canJump = false;
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
        //https://play.google.com/store/apps;?hl=ru&pli=1
        window.open('https://play.google.com/store/apps;?hl=ru&pli=1', '_blank');
        //director.loadScene(director.getScene().name);
    }
    public getRemainingTime(): number {
        return Math.max(0, this.winTime - this.gameTime);
    }
}