/**
 *
 *  Boss entities
 *
 **/
/**
 * EnemyEntity : basic enemies stats
 */
game.BossEntity = me.Entity.extend({
    init: function(x, y, settings, velX, velY, hp, points) {
        // Default params values
        /*************************************************************************/
        if (typeof velX === 'undefined') { this.velX = -1; } else {this.velX = velX;}
        if (typeof velY === 'undefined') { this.velY = 0; } else {this.velY = velY;}
        if (typeof hp === 'undefined') { this.hp = 20; } else {this.hp = hp;}
        if (typeof points === 'undefined') { this.points = 1000; } else {this.points = points;}
        /*************************************************************************/
        // call the super constructor
        this._super(me.Entity, "init", [x, y, settings]);
        this.type = 'ennemy';
        this.alwaysUpdate = true;
        this.pos.add(this.body.vel);
        this.body.gravity = 0;
        this.body.vel.set(this.velX, this.velY);
        this.animationSpeed = 75;
        this.defaultHp = this.hp;
        game.bossHPBar = new me.pool.pull('bossHPBar',me.game.viewport.width/2,25,this.hp);
        me.game.world.addChild(game.bossHPBar, 50);
    },

    update: function(dt) {
        // mechanics
        if (!game.data.start) {
            return this._super(me.Entity, 'update', [dt]);
        }
        this._super(me.Entity, "update", [dt]);
        return true;
    },

    destroy: function(damage){
        // Already dead ?
        if (this.hp > 0){
            this.hp -= damage;
            let lostHPPercent = (100-((game.boss.hp/game.bossHPBar.maxHP)*100));
            if (lostHPPercent > 0)
                game.bossHPBar.lostHPPercent += lostHPPercent;
            if (this.hp <= 0){
                game.data.steps += this.points;
                me.game.world.removeChild(this);

                if (Math.random() < 0.1){
                    // TODO Drop gifts
                    me.game.world.addChild(new me.pool.pull('present', this.pos.x, this.pos.y, this.defaultHp, this.points), 10);
                }
                me.audio.play("hit");
            }
            else if (this.hp > 0)
                me.audio.play("hurt");
        }
    }
});
game.MageBossEntity = game.BossEntity.extend({

    init: function(x, y, velX, velY, hp, points) {
        // Texture and animation
        this._super(game.BossEntity, "init", [x, y, {width : 282, height : 382}, velX, velY, hp, points]);
        this.renderable = game.mageBossTexture.createAnimationFromName([
            "5_animation_attack_001", "5_animation_attack_002", "5_animation_attack_003", "5_animation_attack_004", "5_animation_attack_005",
            "5_animation_attack_006", "5_animation_attack_007", "5_animation_attack_008", "5_animation_attack_009", "5_animation_attack_010",
            "5_animation_attack_011", "5_animation_attack_012", "5_animation_attack_013", "5_animation_attack_014", "5_animation_attack_015",
            "5_animation_attack_016", "5_animation_attack_017", "5_animation_attack_018", "5_animation_attack_019", "5_animation_attack_000",
            "5_animation_hurt_000", "5_animation_hurt_003", "5_animation_hurt_006", "5_animation_hurt_009",
            "5_animation_hurt_010", "5_animation_hurt_013", "5_animation_hurt_016", "5_animation_hurt_019",
            "5_animation_idle_000", "5_animation_idle_003", "5_animation_idle_006", "5_animation_idle_009",
            "5_animation_idle_010", "5_animation_idle_013", "5_animation_idle_016", "5_animation_idle_019",
            "5_animation_walk_000", "5_animation_walk_003", "5_animation_walk_006", "5_animation_walk_009",
            "5_animation_walk_010", "5_animation_walk_013", "5_animation_walk_016", "5_animation_walk_019",
        ]);
        this.animationSpeed = 75;
        this.renderable.anchorPoint = {"x" : 0, "y" : 0};
        this.anchorPoint = {"x" : 0, "y" : 0};
        this.attackFrames = [20,21,22,23,24,25,26,27,20,21,22,23,24,25,26,27,20,21,22,23,24,25,26,27,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19];
        this.renderable.addAnimation ("attack", this.attackFrames,this.animationSpeed);
        this.renderable.addAnimation ("hurt", [20,21,22,23,24,25,26,27],this.animationSpeed+25);
        this.renderable.addAnimation ("idle", [28,29,30,31,32,33,34,35],this.animationSpeed*2);
        this.renderable.addAnimation ("walk", [36,37,38,39,40,41,42,43],this.animationSpeed*2);
        this.renderable.setCurrentAnimation("idle");
        this.currentAttack = 0;
        this.attackDelay = (this.animationSpeed * this.attackFrames.length) + 3000;
        this.lastAttack = Date.now();
        this.hasAttacked = false;
    },

    update: function(dt) {
        this.pos.add(this.body.vel);
        if (this.pos.x <= (me.game.viewport.width/3*2)-100 || (this.pos.x >= me.game.viewport.width-this.renderable.width && this.velX === 1)) {
            this.velX = -this.velX;
            if(this.velY === 0)
                this.velY = -1;
        }
        if (this.pos.y <= 0 || (this.pos.y >= me.game.viewport.height-this.renderable.height)) {
            this.velY = -this.velY;
        }
        if(Date.now() - this.lastAttack >= this.attackDelay) {
            this.renderable.setCurrentAnimation("attack", "idle");
            this.currentAttack = me.Math.random(0, 1);
            this.lastAttack = Date.now();
            this.hasAttacked = false;
        }
        this.checkAttack();
        this.body.vel.set(this.velX, this.velY);
        me.Rect.prototype.updateBounds.apply(this);
        this._super(game.BossEntity, "update", [dt]);
    },

    checkAttack: function () {
        if(this.hasAttacked === false && this.currentAttack === 0 && this.renderable.getCurrentAnimationFrame() === 34) {
            me.game.world.addChild(new me.pool.pull('mageAttackEntity', this.pos.x, this.pos.y + this.renderable.height/2, -3, 0, true, 5), 14);
			me.audio.play("skraa");
            this.hasAttacked = true;
        }
    }
});