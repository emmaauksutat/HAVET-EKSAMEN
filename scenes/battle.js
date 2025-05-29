import { makeDialogBox } from "../entities/dialogBox.js";

const states = {
  default: "default",
  introNpc: "intro-npc",
  introNpcSpiller: "intro-npc-spiller",
  introPlayerSpiller: "intro-player-spiller",
  playerTurn: "player-turn",
  playerAttack: "player-attack",
  npcTurn: "npc-turn",
  battleEnd: "battle-end",
  winnerDeclared: "winner-declared",
};

function makeSpiller(name, x, finalX, y, maxHp, attacks, dataBox) {
  return {
    name,
    finalX,
    x,
    y,
    spriteRef: null,
    maxHp,
    hp: maxHp,
    attacks,
    selectedAttack: null,
    isFainted: false,
    dataBox,
  };
}

function makeDataBox(x, y, nameX, nameY, healthBarX, healthBarY) {
  return {
    x,
    y,
    nameOffset: {
      x: nameX,
      y: nameY,
    },
    healthBarOffset: {
      x: healthBarX,
      y: healthBarY,
    },
    spriteRef: null,
    maxHealthBarLength: 96,
    healthBarLength: 96,
  };
}

export function makeBattle(p) {
  return {
    dialogBox: makeDialogBox(p, 0, 288),
    currentState: "default",
    npc: {
      x: 350,
      y: 20,
      spriteRef: null,
    },
    npcSpiller: makeSpiller(
      "forureningsmonsteret",
      600,
      310,
      20,
      100,
      [
        { name: "SMID EN FLASKE", power: 10 },
        { name: "GØDNING", power: 55 },
        { name: "BLIV VEGETAR", power: 45 },
        { name: "SMID EN MUSLING", power: 50 },
      ],
      makeDataBox(-300, 40, 15, 30, 118, 40)
    ),
    playerSpiller: makeSpiller(
      "dig",
      -170,
      20,
      128,
      100,
      [
        { name: "SMID EN FLASKE", power: 10 },
        { name: "GØDNING", power: 55 },
        { name: "BLIV VEGETAR", power: 45 },
        { name: "SMID EN MUSLING", power: 50 },
      ],
      makeDataBox(510, 220, 38, 30, 136, 40)
    ),
    drawDataBox(spiller) {
      p.image(spiller.dataBox.spriteRef, spiller.dataBox.x, spiller.dataBox.y);
      p.text(
        spiller.name,
        spiller.dataBox.x + spiller.dataBox.nameOffset.x,
        spiller.dataBox.y + spiller.dataBox.nameOffset.y
      );

      p.push();
      p.angleMode(p.DEGREES);
      p.rotate(360);
      p.noStroke();
      if (spiller.dataBox.healthBarLength > 50) {
        p.fill(0, 200, 0);
      }
      if (spiller.dataBox.healthBarLength < 50) {
        p.fill(255, 165, 0);
      }
      if (spiller.dataBox.healthBarLength < 20) {
        p.fill(200, 0, 0);
      }
      p.rect(
        spiller.dataBox.x + spiller.dataBox.healthBarOffset.x,
        spiller.dataBox.y + spiller.dataBox.healthBarOffset.y,
        spiller.dataBox.healthBarLength,
        6
      );
      p.pop();
    },
    async dealDamage(targetSpiller, attackingSpiller) {
      targetSpiller.hp -= attackingSpiller.selectedAttack.power;
      if (targetSpiller.hp > 0) {
        targetSpiller.dataBox.healthBarLength =
          (targetSpiller.hp * targetSpiller.dataBox.maxHealthBarLength) /
          targetSpiller.maxHp;
        return;
      }
      targetSpiller.dataBox.healthBarLength = 0;
      targetSpiller.isFainted = true;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.currentState = states.battleEnd;
    },
    load() {
      this.battleBackgroundImage = p.loadImage("assets/battle-background.png");
      this.npc.spriteRef = p.loadImage("assets/MASTER.png");
      this.npcSpiller.spriteRef = p.loadImage("assets/FIGHTER1.png");
      this.playerSpiller.spriteRef = p.loadImage("assets/FIGHTER2.png");
      this.playerSpiller.dataBox.spriteRef = p.loadImage(
        "assets/databox_thin.png"
      );
      this.npcSpiller.dataBox.spriteRef = p.loadImage(
        "assets/databox_thin_foe.png"
      );
      this.dialogBox.load();
    },
    setup() {
      this.dialogBox.displayText(
        "Havet er i iltmangel !",
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          this.currentState = states.introNpc;
          this.dialogBox.clearText();
          this.dialogBox.displayText(
            `Vi har brug for din hjælp, for at nedbryde \n ${this.npcSpiller.name} !`,
            async () => {
              this.currentState = states.introNpcSpiller;
              await new Promise((resolve) => setTimeout(resolve, 1000));
              this.dialogBox.clearText();
              this.dialogBox.displayText(
                `Kom så!`,
                async () => {
                  this.currentState = states.introPlayerSpiller;
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                  this.dialogBox.clearText();
                  this.dialogBox.displayText(
                    `Hvad vil du gøre?`,
                    async () => {
                      await new Promise((resolve) => setTimeout(resolve, 1000));
                      this.currentState = states.playerTurn;
                    }
                  );
                }
              );
            }
          );
        }
      );
      this.dialogBox.setVisibility(true);
    },
    update() {
      if (this.currentState === states.introNpc) {
        this.npc.x += 0.5 * p.deltaTime;
      }

      if (
        this.currentState === states.introNpcSpiller &&
        this.npcSpiller.x >= this.npcSpiller.finalX
      ) {
        this.npcSpiller.x -= 0.5 * p.deltaTime;
        if (this.npcSpiller.dataBox.x <= 0)
          this.npcSpiller.dataBox.x += 0.5 * p.deltaTime;
      }

      if (
        this.currentState === states.introPlayerSpiller &&
        this.playerSpiller.x <= this.playerSpiller.finalX
      ) {
        this.playerSpiller.x += 0.5 * p.deltaTime;
        this.playerSpiller.dataBox.x -= 0.65 * p.deltaTime;
      }

      if (this.playerSpiller.isFainted) {
        this.playerSpiller.y += 0.8 * p.deltaTime;
      }

      if (this.npcSpiller.isFainted) {
        this.npcSpiller.y += 0.8 * p.deltaTime;
      }

      this.dialogBox.update();
    },
    draw() {
      p.clear();
      p.background(0);
      p.image(this.battleBackgroundImage, 0, 0);

      p.image(this.npcSpiller.spriteRef, this.npcSpiller.x, this.npcSpiller.y);

      this.drawDataBox(this.npcSpiller);

      p.image(
        this.playerSpiller.spriteRef,
        this.playerSpiller.x,
        this.playerSpiller.y
      );

      this.drawDataBox(this.playerSpiller);

      if (
        this.currentState === states.default ||
        this.currentState === states.introNpc
      )
        p.image(this.npc.spriteRef, this.npc.x, this.npc.y);

      if (
        this.currentState === states.playerTurn &&
        !this.playerSpiller.selectedAttack
      ) {
        this.dialogBox.displayTextImmediately(
          `1) ${this.playerSpiller.attacks[0].name}    3) ${this.playerSpiller.attacks[2].name}\n2) ${this.playerSpiller.attacks[1].name}   4) ${this.playerSpiller.attacks[3].name}`
        );
      }

      if (
        this.currentState === states.playerTurn &&
        this.playerSpiller.selectedAttack &&
        !this.playerSpiller.isAttacking &&
        !this.playerSpiller.isFainted
      ) {
        this.dialogBox.clearText();
        this.dialogBox.displayText(
          `${this.playerSpiller.name} valgte ${this.playerSpiller.selectedAttack.name} !`,
          async () => {
            await this.dealDamage(this.npcSpiller, this.playerSpiller);
            if (this.currentState !== states.battleEnd) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              this.dialogBox.clearText();
              this.currentState = states.npcTurn;
            }
          }
        );
        this.playerSpiller.isAttacking = true;
      }

      if (this.currentState === states.npcTurn && !this.npcSpiller.isFainted) {
        this.npcSpiller.selectedAttack =
          this.npcSpiller.attacks[
            Math.floor(Math.random() * this.npcSpiller.attacks.length)
          ];
        this.dialogBox.clearText();
        this.dialogBox.displayText(
          `din modspiller ${this.npcSpiller.name} brugte \n ${this.npcSpiller.selectedAttack.name} !`,
          async () => {
            await this.dealDamage(this.playerSpiller, this.npcSpiller);
            if (this.currentState !== states.battleEnd) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              this.playerSpiller.selectedAttack = null;
              this.playerSpiller.isAttacking = false;
            }
          }
        );
        this.currentState = states.playerTurn;
      }

      if (this.currentState === states.battleEnd) {
        if (this.npcSpiller.isFainted) {
          this.dialogBox.clearText();
          this.dialogBox.displayText(
            `${this.npcSpiller.name} forsvandt ! havet er reddet !`
          );
          this.currentState = states.winnerDeclared;
          return;
        }

        if (this.playerSpiller.isFainted) {
          this.dialogBox.clearText();
          this.dialogBox.displayText(
            `${this.playerSpiller.name} løb tør for ilt ! alle fisk er døde !`
          );
          this.currentState = states.winnerDeclared;
        }
      }

      p.rect(0, 288, 512, 200);
      this.dialogBox.draw();
    },
    onKeyPressed(keyEvent) {
      if (this.currentState === states.playerTurn) {
        switch (keyEvent.key) {
          case "1":
            this.playerSpiller.selectedAttack = this.playerSpiller.attacks[0];
            break;
          case "2":
            this.playerSpiller.selectedAttack = this.playerSpiller.attacks[1];
            break;
          case "3":
            this.playerSpiller.selectedAttack = this.playerSpiller.attacks[2];
            break;
          case "4":
            this.playerSpiller.selectedAttack = this.playerSpiller.attacks[3];
            break;
          default:
        }
      }
    },
  };
}
