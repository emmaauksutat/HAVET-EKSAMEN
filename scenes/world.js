import { makeNPC } from "../entities/npc.js";
import { makePlayer } from "../entities/player.js";
import { makeTiledMap } from "../entities/map.js";
import { makeDialogBox } from "../entities/dialogBox.js";
import { makeCamera } from "../entities/camera.js";

export function makeWorld(p, setScene) {
  return {
    plantedMussels: [],
    camera: makeCamera(p, 100, 0),
    player: makePlayer(p, 0, 0),
    npc: makeNPC(p, 0, 0),
    map: makeTiledMap(p, 100, -150),
    dialogBox: makeDialogBox(p, 0, 280),
    makeScreenFlash: false,
    snakkedeOmZoner: false,
    alpha: 0,
    blinkBack: false,
    easing: 3,

    trashItems: [
      { x: 200, y: 75, collected: false, musselPlanted: false },
      { x: 150, y: 200, collected: false, musselPlanted: false },
      { x: 380, y: 240, collected: false, musselPlanted: false }
    ],

    deadZones: [
      { x: 310, y: 150, cleaned: false },
      { x: 200, y: 250, cleaned: false }
    ],

    keyPressed(keyEvent) {
      if (keyEvent.key === "e" || keyEvent.key === "E") {
        for (const trash of this.trashItems) {
          if (!trash.collected) {
            const d = p.dist(this.player.x, this.player.y, trash.x, trash.y);
            if (d < 30) {
              trash.collected = true;
              console.log("Skrald samlet! Du har nu:", ++this.player.trashCount);
            }
          }
        }
      }

      if (keyEvent.key === "m" || keyEvent.key === "M") {

        this.plantedMussels.push({ x: this.player.x, y: this.player.y });

        // Plant musling på trash-zoner
        for (const trash of this.trashItems) {
          if (!trash.musselPlanted) {
            const d = p.dist(this.player.x, this.player.y, trash.x, trash.y);
            if (d < 30) {
              trash.musselPlanted = true;
              console.log("Du har plantet en musling!");
            }
          }
        }

        // Fjern normale deadZones
        for (const zone of this.deadZones) {
          if (!zone.cleaned) {
            const d = p.dist(this.player.x, this.player.y, zone.x, zone.y);
            if (d < 30) {
              zone.cleaned = true;
              console.log("Du rensede en almindelig zone med muslinger!");
            }
          }
        }
      }
    },

    load() {
      this.dialogBox.load();
      this.map.load("./assets/Havet.png", "./maps/world.json");
      this.player.load();
      this.npc.load();
    },

    setup() {
      this.map.prepareTiles();
      const spawnPoints = this.map.getSpawnPoints();
      for (const spawnPoint of spawnPoints) {
        switch (spawnPoint.name) {
          case "player":
            this.player.x = this.map.x + spawnPoint.x;
            this.player.y = this.map.y + spawnPoint.y + 32;
            break;
          case "npc":
            this.npc.x = this.map.x + spawnPoint.x;
            this.npc.y = this.map.y + spawnPoint.y + 32;
            break;
        }
      }
      this.player.setup();
      this.camera.attachTo(this.player);
      this.npc.setup();
    },

    update() {
      const alleZonerRenset = this.deadZones.every(zone => zone.cleaned) &&
        this.trashItems.every(t => t.collected && t.musselPlanted);

      if (alleZonerRenset && !this.dialogBox.visible && !this.snakkedeOmZoner) {
        this.snakkedeOmZoner = true;
        this.dialogBox.displayText("Flot! Du har renset alle zoner – tal med mig.");
        setTimeout(() => this.dialogBox.setVisibility(false), 3000);
        this.dialogBox.setVisibility(true);
      }

      this.camera.update();
      this.player.update();
      this.npc.update();
      this.dialogBox.update();

      if (this.alpha <= 0) this.blinkBack = true;
      if (this.alpha >= 255) this.blinkBack = false;
      this.alpha += (this.blinkBack ? 1 : -1) * 0.7 * this.easing * p.deltaTime;
    },

    draw() {
      p.clear();
      p.background(0);

      this.npc.handleCollisionsWith(this.player, () => {
        this.dialogBox.displayText(
          "Jeg kan se at du har lært om havet.\nLad os teste din viden !",
          async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.dialogBox.setVisibility(false);
            this.makeScreenFlash = true;
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.makeScreenFlash = false;
            setScene("battle");
          }
        );
        this.dialogBox.setVisibility(true);
      });

      this.map.draw(this.camera, this.player, this.trashItems);
      this.npc.draw(this.camera);
      this.player.draw(this.camera);

      // 💩 Tegn skrald og "stærke" zoner
      for (const trash of this.trashItems) {
        const screenX = trash.x + this.camera.x;
        const screenY = trash.y + this.camera.y;

        if (!(trash.collected && trash.musselPlanted)) {
          if (trash.collected || trash.musselPlanted) {
            p.fill(0, 150, 255); // halvt renset → blå
          } else {
            p.fill(139, 69, 19); // beskidt → brun
          }
          p.ellipse(screenX, screenY, 20, 20);
        }

        if (!trash.collected) {
          p.fill(180);
          p.rect(screenX, screenY, 10, 10);
        }
      }

  // 🌫 Almindelige zoner
for (const zone of this.deadZones) {
  if (zone.cleaned) continue; // ✅ Fjern den fra tegningen, når den er renset

  const screenX = zone.x + this.camera.x;
  const screenY = zone.y + this.camera.y;
  p.fill(139, 69, 19); // brun
  p.ellipse(screenX, screenY, 20, 20);
}
// 🐚 Vis alle plantede muslinger
for (const mussel of this.plantedMussels) {
  const screenX = mussel.x + this.camera.x;
  const screenY = mussel.y + this.camera.y;
  p.fill(255, 255, 255);
  p.ellipse(screenX, screenY, 10, 10);
}
      this.dialogBox.draw();

      if (this.makeScreenFlash) {
        p.fill(0, 0, 0, this.alpha);
        p.rect(0, 0, 512, 384);
      }
    },

    keyReleased() {
      const keys = [p.RIGHT_ARROW, p.LEFT_ARROW, p.UP_ARROW, p.DOWN_ARROW];
      if (keys.some(k => p.keyIsDown(k))) return;

      switch (this.player.direction) {
        case "up": this.player.setAnim("idle-up"); break;
        case "down": this.player.setAnim("idle-down"); break;
        case "left":
        case "right": this.player.setAnim("idle-side"); break;
      }
    }
  };
}
