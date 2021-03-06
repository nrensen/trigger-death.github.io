/*=====================================================================================
CALC COOKIE MOD
=======================================================================================*/

// Author:       Robert Jordan
// Written For:  v.1.0501 beta
// Repository:   https://github.com/nrensen/TriggerCookies/tree/master/TriggerCookies
// Raw File:     https://github.com/nrensen/TriggerCookies/raw/master/TriggerCookies/Scripts/CalcCookie.js

/*=====================================================================================
QUICK FUNCTIONS
=======================================================================================*/
//#region Quick Functions

/* Returns true if the variable is defined and equals the value. */
function IsDefined(name, value) {
	return eval('(typeof ' + name.split('.')[0] + ' !== \'undefined\') && (typeof ' + name + ' !== \'undefined\') && (' + name + ' === ' + value + ')');
}
/* Creates an interval to wait until TriggerCookies is loaded */
function IntervalUntilLoaded(func) {
	var checkReady = setInterval(function () {
		if (IsDefined('TriggerCookies.Loaded', 'true')) {
			func();
			clearInterval(checkReady);
		}
	}, 100);
}

/* Returns the element used in this mod. */
function lCalc(name) {
	if (name.indexOf('CalcCookie') != 0)
		return l('CalcCookie' + name);
	return l(name);
}
/* Returns the element with the name used in this mod. */
function iCalc(name) {
	if (name.indexOf('CalcCookie') != 0)
		return 'CalcCookie' + name;
	return name;
}
/* Available cookies, allowing for protected amount. */
function AvailableCookies() {
	var mult = 0;
	if (!CalcCookie.MaintainLucky || CalcCookie.BestOverallItem.Time < 1800)
		mult = 0;
	else if (Game.Upgrades['Get lucky'].bought)
		mult = 42000;
	else if (Game.Upgrades['Serendipity'].bought)
		mult = 6000;
	else if (Game.Upgrades['Lucky day'].bought)
		mult = 1000;
	if (Game.frenzy > 0)
		mult = mult / Game.frenzyPower;
	return Game.cookies - Game.cookiesPs * mult;
}

//#endregion
/*=====================================================================================
CALC COOKIE DEFINITIONS
=======================================================================================*/
//#region Definitions

/* The static class that manages the Bci Cookie mod. */
CalcCookie = {};
/* True if the mod has been loaded. */
CalcCookie.Loaded = false;
/* True if the mod is enabled. */
CalcCookie.Enabled = false;

//#endregion
/*=====================================================================================
CALC COOKIE INITIALIZATION
=======================================================================================*/
//#region Initialization

/* Initializes Bci Cookie. */
CalcCookie.Init = function () {
	IntervalUntilLoaded(function () {
		// Calc Cookie is a background mod that other mods reference
		// Thus this mod should not be loaded normally or seen
		CalcCookie.Enable(true);

		CalcCookie.Loaded = true;
	});
}
/* Loads Bci Cookie. */
CalcCookie.Enable = function (firstTime) {

	if (firstTime) {
		function AddUpgrade(name, value) { CalcCookie.ValuedUpgrades[name] = value||50; }

		// These upgrades should always be next to buy, lowest price is bought first

		// Golden Cookie Upgrades
		AddUpgrade('Lucky day', 100);
		AddUpgrade('Serendipity', 100);
		AddUpgrade('Get lucky', 100);

		// Research Upgrades
		AddUpgrade('Bingo center/Research facility', 100);
		AddUpgrade('Persistent memory', 50);
		AddUpgrade('Sacrificial rolling pins', 50);
		
		// Easter Upgrades
		AddUpgrade('Golden goose egg', 50);
		AddUpgrade('Faberge egg', 50);
		AddUpgrade('Wrinklerspawn', 50);
		AddUpgrade('Omelette', 50);
		AddUpgrade('Chocolate egg', 0);

		// Christmas Upgrades
		AddUpgrade('A festive hat', 50);
		AddUpgrade('Reindeer baking grounds', 50);
		AddUpgrade('Weighted sleighs', 50);
		AddUpgrade('Ho ho ho-flavored frosting', 50);
		AddUpgrade('Season savings', 50);
		AddUpgrade('Toy workshop', 50);
		AddUpgrade('Santa\'s bottomless bag', 50);
		AddUpgrade('Santa\'s helpers', 50);
		AddUpgrade('Santa\'s milk and cookies', 50);

		// Default Settings
		//CalcCookie.Actions['buildingbci'].Enable(false);
		//CalcCookie.Actions['upgradebci'].Enable(false);
		CalcCookie.Actions['clickrate'].Enable(false);

		// Overwrite building tooltips
		for (var i = 0; i < Game.ObjectsN; i++) {
			Overrides.OverrideFunction('Game.ObjectsById[' + i + '].tooltip', 'CalcCookie.BuildingTooltipBCI', 'CalcCookie');
		}
		// Overwrite store rebuilding
		Overrides.OverrideFunction('Game.RebuildUpgrades', 'CalcCookie.RebuildUpgrades', 'CalcCookie');

		// Rebuild Upgrades
		Game.RebuildUpgrades();
	}


	CalcCookie.Enabled = true;
}

//#endregion
/*=====================================================================================
CALC COOKIE FUNCTIONS
=======================================================================================*/
//#region Functions
//-------------------------------------------------------------------------------------
//#region BCI

/* Updates both building and upgrade visual BCIs. */
CalcCookie.UpdateBCI = function () {
	CalcCookie.UpdateBuildingBCI();
	CalcCookie.UpdateUpgradeBCI();
}
/* Updates both building visual BCIs. */
CalcCookie.UpdateBuildingBCI = function () {
	CalcCookie.Price.FindBuildingBCIs();

	var colors = ['#6F6', '#FF6', '#FB5', '#F95', '#F55', /*Valued color*/'#5FF', /*Invalid color*/'#EEF'];
	var baseInfo = CalcCookie.BuildingBCIs;
	var values = CalcCookie.BuildingBCIs.values;

	for (var i = 0; i < values.length; i++) {
		var priceID = l('productPrice' + i);
		var info = values[i];
		var bci = values[i].bci;
		var bci2 = (values[i].bci - baseInfo.bestBCI) / (baseInfo.worstBCI - baseInfo.bestBCI);

		var colorIndex = 0;
		if (!isFinite(bci) || isNaN(bci)) {
			colorIndex = 6; // Invalid
			bci = NaN;
		}
		else if (bci == baseInfo.bestBCI)
			colorIndex = 0;
		else if (bci == baseInfo.worstBCI)
			colorIndex = 4;
		else if (bci == 0)
			colorIndex = 5; // Valued
		else if (bci2 > 0) {
			if (bci2 <= 0.2)
				colorIndex = 1;
			else if (bci2 <= 0.5)
				colorIndex = 2;
			else
				colorIndex = 3;
		}

		priceID.style.color = colors[colorIndex];

		Game.ObjectsById[i].bci = bci;
		Game.ObjectsById[i].income = info.income;
		Game.ObjectsById[i].timeLeft = info.time;
		Game.ObjectsById[i].bciColor = colors[colorIndex];
	}
}
/* Updates both upgrade visual BCIs. */
CalcCookie.UpdateUpgradeBCI = function () {
	CalcCookie.Price.FindUpgradeBCIs();

	var colors = ['#6F6', '#FF6', '#FB5', '#F95', '#F55', /*Valued color*/'#5FF', /*Invalid color*/'#EEF'];
	var baseInfo = CalcCookie.UpgradeBCIs;
	var values = CalcCookie.UpgradeBCIs.values;

	for (var i in Game.UpgradesInStore) {
		var triangleID = l('upgradeBCI' + i);
		var upgrade = Game.UpgradesInStore[i];
		var info = values[i];
		var bci = values[i].bci;
		var bci2 = (values[i].bci - baseInfo.bestBCI) / (baseInfo.worstBCI - baseInfo.bestBCI);

		var colorIndex = 0;
		if (!isFinite(bci) || isNaN(bci)) {
			colorIndex = 6; // Invalid
			bci = NaN;
			if (info.valued)
				colorIndex = 5; // Valued
		}
		else if (info.valued)
			colorIndex = 5; // Valued
		else if (bci == baseInfo.bestBCI)
			colorIndex = 0;
		else if (bci == baseInfo.worstBCI)
			colorIndex = 4;
		else if (bci == 0)
			colorIndex = 5; // Valued
		else if (bci2 > 0) {
			if (bci2 <= 0.2)
				colorIndex = 1;
			else if (bci2 <= 0.5)
				colorIndex = 2;
			else
				colorIndex = 3;
		}

		upgrade.bci = bci;
		upgrade.bciColor = colors[colorIndex];
		upgrade.income = info.income;
		upgrade.timeLeft = info.time;
		if (triangleID != null)
			triangleID.style.borderColor = colors[colorIndex] + ' transparent transparent';
	}
}

//#endregion
//-------------------------------------------------------------------------------------
//#region Tooltips

/* Sets up the building BCI tooltips. */
CalcCookie.BuildingTooltipBCI = function () {
	var me = this;
	var desc = me.desc;
	var name = me.name;
	if (Game.season == 'fools') {
		if (!Game.foolObjects[me.name]) {
			name = Game.foolObjects['Unknown'].name;
			desc = Game.foolObjects['Unknown'].desc;
		}
		else {
			name = Game.foolObjects[me.name].name;
			desc = Game.foolObjects[me.name].desc;
		}
	}
	if (me.locked) {
		name = '???';
		desc = '';
	}

	return '<div style="min-width:300px;"><div style="float:right;"><span class="price">' + Beautify(Math.round(me.price)) + '</span></div><div class="name">' + name + '</div>' + '<small>[owned : ' + me.amount + '</small>]' +
	'<div class="description">' + desc + '</div>' +
	(CalcCookie.Actions['buildingbci'].Enabled ? 
		'<div class="data" ' + (me.totalCookies > 0 ? 'style="padding-bottom: 0px;"' : '') + '>' +
		('&bull; ' + ('Payback time:'.fontcolor(me.bciColor) + ' <b>' + Helper.Numbers.GetTime(me.bci * 1000, 4).fontcolor(me.bciColor) + '</b><br>')) +
		('&bull; ' + ('CPS gain:' + ' <b>' + Beautify(me.income) + '</b><br>')) +
		(me.timeLeft > 0 ? '&bull; ' + ('Time Left:' + ' <b>' + Helper.Numbers.GetTime(me.timeLeft * 1000, 4) + '</b><br>') : '') : '') +
	(me.totalCookies > 0 ? (
		'</div><div class="data">' +
		(me.amount > 0 ? '&bull; each ' + me.single + ' produces <b>' + Beautify((me.storedTotalCps / me.amount) * Game.globalCpsMult, 1) + '</b> ' + ((me.storedTotalCps / me.amount) * Game.globalCpsMult == 1 ? 'cookie' : 'cookies') + ' per second<br>' : '') +
		'&bull; ' + me.amount + ' ' + (me.amount == 1 ? me.single : me.plural) + ' producing <b>' + Beautify(me.storedTotalCps * Game.globalCpsMult, 1) + '</b> ' + (me.storedTotalCps * Game.globalCpsMult == 1 ? 'cookie' : 'cookies') + ' per second (<b>' + Beautify((me.amount > 0 ? ((me.storedTotalCps * Game.globalCpsMult) / Game.cookiesPs) : 0) * 100, 1) + '%</b> of total)<br>' +
		'&bull; <b>' + Beautify(me.totalCookies) + '</b> ' + (Math.floor(me.totalCookies) == 1 ? 'cookie' : 'cookies') + ' ' + me.actionName + ' so far</div>'
	) : '') +
	'</div>';
}
/* Sets up the upgrade BCI tooltips. */
CalcCookie.UpgradeTooltipBCI = function () {
	var me = this;
	return '<div style="min-width:200px;"><div style="float:right;"><span class="price">' + Beautify(Math.round(me.getPrice())) + '</span></div><small>' + (me.pool == 'toggle' ? '[Togglable]' : '[Upgrade]') + '</small><div class="name">' + me.name + '</div><div class="description">' + me.desc + '</div>' +
		'<div class="data">' +
		'&bull; ' + ('Payback time:'.fontcolor(me.bciColor) + ' <b>' + ((isFinite(me.bci) && !isNaN(me.bci)) ? Helper.Numbers.GetTime(me.bci * 1000, 4) : 'N/A').fontcolor(me.bciColor) + '</b><br>') +
		'&bull; ' + ('CPS gain:' + ' <b>' + ((isFinite(me.income) && !isNaN(me.income)) ? Beautify(me.income) : 'N/A') + '</b><br>') +
		(me.timeLeft > 0 ? ('&bull; ' + ('Time Left:' + ' <b>' + Helper.Numbers.GetTime(me.timeLeft * 1000, 4) + '</b><br>')) : '') +
		'</div></div>';
}
/* Rebuildings the upgrades and sets up the upgrade BCI. */
CalcCookie.RebuildUpgrades = function () {
	Overrides.Backup.Functions['Game.RebuildUpgrades'].func();

	if (!CalcCookie.Actions['upgradebci'].Enabled)
		return;

	CalcCookie.UpdateUpgradeBCI();

	var storeStr = '';
	for (var i in Game.UpgradesInStore) {
		var me = Game.UpgradesInStore[i];
		if (me.pool == 'toggle' || me.pool == 'tech')
			continue;

		storeStr += '<div class="crate upgrade';
		if (me.getPrice() < Game.cookies)
		    storeStr += ' enabled';
		storeStr += '" ';
		storeStr += Game.getDynamicTooltip('CalcCookie.UpgradeTooltipBCI.bind(Game.UpgradesById[' + me.id + '])', 'store') + ' ' +
		Game.clickStr + '="Game.UpgradesById[' + me.id + '].buy();" id="upgrade' + i + '" style="' + (me.icon[2] ? 'background-image:url(' + me.icon[2] + ');' : '') + 'background-position:' + (-me.icon[0] * 48) + 'px ' + (-me.icon[1] * 48) + 'px;">' +
		'<div id="upgradeBCI' + i + '" style="width: 0; height: 0; border-style: solid; border-width: 10px 10px 0 0; border-color: ' + me.bciColor + ' transparent transparent"></div>';
		storeStr += '</div>';
	}
	l('upgrades').innerHTML = storeStr;
}
CalcCookie.BuildingBCIOff = function () {

	for (var i = 0; i < Game.ObjectsN; i++) {
		var textID = l('productPrice' + i);
		var building = Game.ObjectsById[i];

		if (building.getPrice() <= Game.cookies)
			textID.style.color = '#6F6';
		else
			textID.style.color = '#F66';
	}
}
CalcCookie.RefreshUpgrades = function() {

	CalcCookie.RebuildUpgrades();
}

//#endregion
//-------------------------------------------------------------------------------------
//#region Click Rate

/* Gets the click rate of the big cookie. */
CalcCookie.UpdateClickRate = function () {
	var old = CalcCookie.Clicks[CalcCookie.Clicks.length - 1];
	var cur = { clicks: Game.cookieClicks, time: new Date().getTime() };
	CalcCookie.ClicksPerSecond = (cur.clicks - old.clicks) /
	    (cur.time - old.time) * 1000;

	for (var i = 0; i < CalcCookie.Clicks.length - 1; i++)
		CalcCookie.Clicks[i + 1] = CalcCookie.Clicks[i];
	CalcCookie.Clicks[0] = cur;
}

//#endregion
//-------------------------------------------------------------------------------------
//#endregion
/*=====================================================================================
CALC COOKIE BUYOUT ITEM
=======================================================================================*/
//#region Buyout Item

function BuyoutItem(name, type, priority, price, bci, income, time) {
	this.Name = name || '';
	this.Type = type || 'invalid';
	this.Priority = priority || 0;
	this.Price = price || 0;
	this.BCI = (typeof bci === 'undefined' ? NaN : bci);
	this.Time = time || 0;
}
BuyoutItem.prototype.Buy = function () {
	if (this.Type == 'building')
		Game.Objects[this.Name].buy();
	else if (this.Type == 'upgrade')
		Game.Upgrades[this.Name].buy(true);
}
BuyoutItem.prototype.CanAfford = function () {
	return this.Price <= AvailableCookies();
}

//#endregion
/*=====================================================================================
CALC COOKIE SEASONS
=======================================================================================*/
//#region Seasons

function SeasonCalculator() {
	this.Seasons = ['christmas', 'valentines', 'easter', 'halloween', 'fools'];
	this.SeasonTriggers = {
		christmas: 'Festive biscuit',
		valentines: 'Lovesick biscuit',
		easter: 'Bunny biscuit',
		halloween: 'Ghostly biscuit',
		fools: 'Fool\'s biscuit'
	};

	this.NewSeason = '';
	this.BestItem = new BuyoutItem();

	this.CycleComplete = false;
	this.ChristmasComplete = false;
	this.ValentinesComplete = false;
	this.EasterComplete = false;
	this.HalloweenComplete = false;

	this.SantaDrops = 0;
	this.ChristmasCookies = 0;
	this.SpookyCookies = 0
	this.HeartCookies = 0;
	this.EasterEggs = 0;
	this.RareEggs = 0;

	this.Lists = {};
	this.Lists.ChristmasCookies = ['Christmas tree biscuits', 'Snowflake biscuits', 'Snowman biscuits', 'Holly biscuits', 'Candy cane biscuits', 'Bell biscuits', 'Present biscuits'];
	this.Lists.SpookyCookies = ['Skull cookies', 'Ghost cookies', 'Bat cookies', 'Slime cookies', 'Pumpkin cookies', 'Eyeball cookies', 'Spider cookies'];
	this.Lists.EasterEggs = ['Chicken egg', 'Duck egg', 'Turkey egg', 'Quail egg', 'Robin egg', 'Ostrich egg', 'Cassowary egg', 'Salmon roe', 'Frogspawn', 'Shark egg', 'Turtle egg', 'Ant larva', 'Golden goose egg', 'Faberge egg', 'Wrinklerspawn', 'Cookie egg', 'Omelette', 'Chocolate egg', 'Century egg', '"egg"'];
	this.Lists.RareEggs = ['Golden goose egg', 'Faberge egg', 'Wrinklerspawn', 'Cookie egg', 'Omelette', 'Chocolate egg', 'Century egg', '"egg"'];
}
SeasonCalculator.prototype.FindBestUpgrade = function (autoSeason, maintainSeason) {

	this.BestItem = new BuyoutItem();

	if (autoSeason && !this.CycleComplete) {
		this.Update();

		if (this.NewSeason != '') {
			if (Game.Has('Season switcher')) {
				var name = this.SeasonTriggers[this.NewSeason];
				var info = CalcCookie.Price.CalculateUpgradeBCI(Game.Upgrades[name]);
				this.BestItem = new BuyoutItem(name, 'upgrade', 13, info.price, info.bci, info.income, info.time);
			}
			this.NewSeason = '';
		}

		if (!this.ChristmasComplete && this.BestItem.Priority < 12) {
			var hat = Game.Upgrades['A festive hat'];

			if (Game.HasUnlocked(hat.name) &&
			    !Game.Has(hat.name) &&
			    (hat.getPrice() < this.BestItem.Price ||
			    this.BestItem.Type == 'invalid')) {
				var info = CalcCookie.Price.CalculateUpgradeBCI(hat);
				this.BestItem = new BuyoutItem(hat.name,
				    'upgrade', 11, info.price, info.bci,
				    info.income, info.time);
			}

			// Upgrade the jolly old man so he can deliver to
			// more and more little kiddies
			if (Game.Has(hat.name) &&
			    Game.santaLevel < Game.santaLevels.length - 1) {
				var toggle = Game.ToggleSpecialMenu;
				Game.ToggleSpecialMenu = function() {};
				Game.UpgradeSanta();
				Game.ToggleSpecialMenu = toggle;
			}

			// Buy Santa drops
			for (var i in Game.santaDrops) {
				var drop = Game.Upgrades[Game.santaDrops[i]];
				if (Game.HasUnlocked(drop.name) &&
				    !Game.Has(drop.name) &&
				    (drop.getPrice() < this.BestItem.Price ||
				    this.BestItem.Type == 'invalid')) {
					var info = CalcCookie.Price.CalculateUpgradeBCI(drop);
					this.BestItem = new BuyoutItem(
					    drop.name, 'upgrade', 11,
					    info.price, info.bci, info.income,
					    info.time);
				}
			}

			// Buy xmas cookies
			for (var i in this.Lists.ChristmasCookies) {
				var name = this.Lists.ChristmasCookies[i];
				var cookie = Game.Upgrades[name];

				if (Game.HasUnlocked(cookie.name) &&
				    !Game.Has(cookie.name) &&
				    (cookie.getPrice() < this.BestItem.Price ||					    this.BestItem.Type == 'invalid')) {
					var info = CalcCookie.Price.CalculateUpgradeBCI(cookie);
					this.BestItem = new BuyoutItem(
					    cookie.name, 'upgrade', 11,
					    info.price, info.bci, info.income,
					    info.time);
				}
			}
		}
		if (!this.ValentinesComplete && this.BestItem.Priority < 12) {
			for (var i in Game.UnlockAt) {
				var at = Game.UnlockAt[i];
				if (at.season != 'valentines')
					continue;
				var upgrade = Game.Upgrades[at.name];
				if (Game.HasUnlocked(upgrade.name) &&
				    !Game.Has(upgrade.name) &&
				    (upgrade.getPrice() < this.BestItem.Price ||
				    this.BestItem.Type == 'invalid')) {
					var info = CalcCookie.Price.CalculateUpgradeBCI(upgrade);
					this.BestItem = new BuyoutItem(
					    upgrade.name, 'upgrade', 11,
					    info.price, info.bci, info.income,
					    info.time);
				}
			}
		}
		if (!this.EasterComplete && this.BestItem.Priority < 12) {
			for (var i = 0; i < this.Lists.EasterEggs.length; i++) {
				var name = this.Lists.EasterEggs[i];

				if (name != 'Chocolate egg' && Game.HasUnlocked(name) && !Game.Has(name) && (Game.Upgrades[name].getPrice() < this.BestItem.Price || this.BestItem.Type == 'invalid')) {
					var info = CalcCookie.Price.CalculateUpgradeBCI(Game.Upgrades[name]);
					this.BestItem = new BuyoutItem(name, 'upgrade', 11, info.price, info.bci, info.income, info.time);
				}
			}
		}
		if (!this.HalloweenComplete && this.BestItem.Priority < 12) {
			for (var i = 0; i < this.Lists.SpookyCookies.length; i++) {
				var name = this.Lists.SpookyCookies[i];

				if (Game.HasUnlocked(name) && !Game.Has(name) && (Game.Upgrades[name].getPrice() < this.BestItem.Price || this.BestItem.Type == 'invalid')) {
					var info = CalcCookie.Price.CalculateUpgradeBCI(Game.Upgrades[name]);
					this.BestItem = new BuyoutItem(name, 'upgrade', 11, info.price, info.bci, info.income, info.time);
				}
			}
		}
	}
	else if (maintainSeason != '' && Game.season != maintainSeason) {
		if (Game.Has('Season switcher')) {
			var name = this.SeasonTriggers[maintainSeason];
			var info = CalcCookie.Price.CalculateUpgradeBCI(Game.Upgrades[name]);
			this.BestItem = new BuyoutItem(name, 'upgrade', 13, info.price, info.bci, info.income, info.time);
		}
	}

	CalcCookie.BestSeasonItem = this.BestItem;
}
SeasonCalculator.prototype.Update = function () {

	//======== CHRISTMAS ========

	// Check Santa level
	this.ChristmasComplete = Game.santaLevel == Game.santaLevels.length - 1;

	// Check Santa drops
	this.SantaDrops = 0;
	for (var i in Game.santaDrops)
		if (Game.Has(Game.santaDrops[i]))
			this.SantaDrops++;
		else
			this.ChristmasComplete = false;

	// Check Christmas cookies
	this.ChristmasCookies = 0;
	for (var i in this.Lists.ChristmasCookies)
		if (Game.Has(this.Lists.ChristmasCookies[i]))
			this.ChristmasCookies++;
		else
			this.ChristmasComplete = false;

	//======== HALLOWEEN ========

	// Check spooky cookies
	this.HalloweenComplete = true;
	this.SpookyCookies = 0;
	for (var i = 0; i < this.Lists.SpookyCookies.length; i++) {
		var name = this.Lists.SpookyCookies[i];
		if (Game.Has(name)) this.SpookyCookies++;
		else this.HalloweenComplete = false;
	}

	//======== VALENTINES DAY ========

	// Check heart cookies
	this.ValentinesComplete = true;
	this.HeartCookies = 0;
	for (var i in Game.UnlockAt) {
		var at = Game.UnlockAt[i];
		if (at.season != 'valentines')
			continue;
		if (Game.Has(at.name))
			this.HeartCookies++;
		else
			this.ValentinesComplete = false;
	}

	//======== EASTER ========

	// Check easter eggs
	this.EasterComplete = true;
	this.EasterEggs = 0;
	for (var i = 0; i < this.Lists.EasterEggs.length; i++) {
		var name = this.Lists.EasterEggs[i];
		if (Game.Has(name) || (name == 'Chocolate egg' && Game.HasUnlocked('Chocolate egg'))) this.EasterEggs++;
		else this.EasterComplete = false;
	}
	// Check rare eggs
	this.RareEggs = 0;
	for (var i = 0; i < this.Lists.RareEggs.length; i++) {
		var name = this.Lists.RareEggs[i];
		if (Game.Has(name) || (name == 'Chocolate egg' && Game.HasUnlocked('Chocolate egg'))) this.RareEggs++;
	}

	//======== ALL SEASONS ========

	if (Game.season == 'christmas') {
		if (this.ChristmasComplete) {
			if (!this.ValentinesComplete)
				this.NewSeason = 'valentines';
			else if (!this.EasterComplete)
				this.NewSeason = 'easter';
			else if (!this.HalloweenComplete)
				this.NewSeason = 'halloween';
		}
		else if (!this.ValentinesComplete &&
		    Game.santaLevel == Game.santaLevels.length - 1 &&
		    this.SantaDrops == Game.santaDrops.length)
			this.NewSeason = 'valentines';
	}
	else if (Game.season == 'valentines') {
		if (this.ValentinesComplete) {

			if (!this.ChristmasComplete)
				this.NewSeason = 'christmas';
			else if (!this.EasterComplete)
				this.NewSeason = 'easter';
			else if (!this.HalloweenComplete)
				this.NewSeason = 'halloween';
		}
	}
	else if (Game.season == 'easter') {
		if (this.EasterComplete) {

			if (!this.ChristmasComplete)
				this.NewSeason = 'christmas';
			else if (!this.ValentinesComplete)
				this.NewSeason = 'valentines';
			else if (!this.HalloweenComplete)
				this.NewSeason = 'halloween';
		}
	}
	else if (Game.season == 'halloween') {
		if (this.HalloweenComplete) {

			if (!this.ChristmasComplete)
				this.NewSeason = 'christmas';
			else if (!this.ValentinesComplete)
				this.NewSeason = 'valentines';
			else if (!this.EasterComplete)
				this.NewSeason = 'easter';
		}
	}
	else {
		if (!this.ChristmasComplete)
			this.NewSeason = 'christmas';
		else if (!this.ValentinesComplete)
			this.NewSeason = 'valentines';
		else if (!this.EasterComplete)
			this.NewSeason = 'easter';
		else if (!this.HalloweenComplete)
			this.NewSeason = 'halloween';
	}

	if (!Game.Has('Season switcher')) {
		this.NewSeason = '';
	}

	if (this.ChristmasComplete && this.ValentinesComplete && this.EasterComplete && this.HalloweenComplete) {
		this.CycleComplete = true;
	}
}

//#endregion
/*=====================================================================================
CALC COOKIE DRAGON
=======================================================================================*/
//#region Dragon

function DragonCalculator() {
}
DragonCalculator.prototype.SetAura = function(aura, slot) {
	var toggle = Game.ToggleSpecialMenu;
	Game.ToggleSpecialMenu = function() {}
	Game.SetDragonAura(aura, slot);
	Game.ConfirmPrompt();
	Helper.TimeLog('Krumblor: Set ' + (slot == 0 ? 'first' : 'second') +
	    ' aura to ' + Game.dragonAuras[aura].name);
	Game.ToggleSpecialMenu = toggle;
}
DragonCalculator.prototype.FindBestUpgrade = function (aura1, aura2) {
	CalcCookie.BestDragonItem = new BuyoutItem();

	if (aura1 == 0 && aura2 == 0)
		return;

	if (Game.dragonAura == aura1 && Game.dragonAura2 == aura2)
		return;

	var krumblor = Game.Upgrades['A crumbly egg'];
	
	if (!Game.HasUnlocked(krumblor.name))
		return;

	if (!Game.Has(krumblor.name)) {
		var info = CalcCookie.Price.CalculateUpgradeBCI(krumblor);
		CalcCookie.BestDragonItem = new BuyoutItem(krumblor.name,
		    'upgrade', 13, info.price, info.bci, info.income,
		    info.time);
		return;
	}

	// The actual training probably belongs in AutoCookie
	while ((aura1 != 0 && Game.dragonLevel < aura1 + 4) ||
	    (aura2 != 0 && Game.dragonLevel < Game.dragonLevels.length - 1)) {
		var oldlevel = Game.dragonLevel;
		var toggle = Game.ToggleSpecialMenu;
		Game.ToggleSpecialMenu = function() {}
		Game.UpgradeDragon();
		Game.ToggleSpecialMenu = toggle;
		if (oldlevel == Game.dragonLevel)
			break;
		Helper.TimeLog('Krumblor: ' +
		    Game.dragonLevels[Game.dragonLevel - 1].action);
	}

	if (aura1 != 0 && Game.dragonAura != aura1 &&
	    Game.dragonLevel >= aura1 + 4)
		this.SetAura(aura1, 0);

	if (aura2 != 0 && Game.dragonAura2 != aura2 &&
	    Game.dragonLevel == Game.dragonLevels.length - 1)
		this.SetAura(aura2, 1);
}
//#endregion
/*=====================================================================================
CALC COOKIE CALCULATOR
=======================================================================================*/
//#region Calculator

function PriceCalculator() {
	this.Research = {
		'Specialized chocolate chips': 0,
		'Designer cocoa beans': 1,
		'Ritual rolling pins': 2,
		'Underworld ovens': 3,
		'One mind': 4,
		'Exotic nuts': 5,
		'Communal brainsweep': 6,
		'Arcane sugar': 7,
		'Elder Pact': 8
	};
	this.GLevel = 0;
	this.GLevels = { 'One mind': 1, 'Communal brainsweep': 2, 'Elder Pact': 3 };
}
PriceCalculator.prototype.EstimatedCPS = function () {
	return Game.cookiesPs * (1 - Game.cpsSucked) + (CalcCookie.ClicksPerSecond * Game.computedMouseCps);
}
PriceCalculator.prototype.CalculateBCI = function(price, oldCPS, newCPS) {
	// Adapted from frozen cookies plugin
	var bci = price / (newCPS - oldCPS);
	if (oldCPS > 0)
		bci += 1.15 * Math.max(0, price - AvailableCookies()) / oldCPS;
	return bci;
}
PriceCalculator.prototype.CalculateBuildingBCI = function (building) {
	// Prevent achievements from testing building CPS
	var GameWinBackup = Game.Win;
	Game.Win = function () { };

	var price = Math.round(building.getPrice());
	building.amount++; Game.CalculateGains();
	var newCPS = this.EstimatedCPS();
	building.amount--; Game.CalculateGains();
	var oldCPS = this.EstimatedCPS();

	// Restore achievements function
	Game.Win = GameWinBackup;

	return {
		bci: this.CalculateBCI(price, oldCPS, newCPS),
		income: newCPS - oldCPS,
		cps: newCPS,
		price: price,
		afford: (price <= AvailableCookies()),
		time: ((price <= AvailableCookies()) ? 0 : (price - AvailableCookies()) / oldCPS)
	};
}
PriceCalculator.prototype.CalculateUpgradeBCI = function (upgrade) {
	// Prevent achievements from testing building CPS
	var GameWinBackup = Game.Win;
	Game.Win = function () { };

	var bought = upgrade.bought;
	var price = Math.round(upgrade.getPrice());
	upgrade.bought = 1; Game.CalculateGains();
	var newCPS = this.EstimatedCPS();
	upgrade.bought = bought; Game.CalculateGains();
	var oldCPS = this.EstimatedCPS();

	// Restore achievements function
	Game.Win = GameWinBackup;

	return {
		bci: this.CalculateBCI(price, oldCPS, newCPS),
		income: newCPS - oldCPS,
		cps: newCPS,
		price: price,
		afford: (price <= AvailableCookies()),
		time: ((price <= AvailableCookies()) ? 0 : (price - AvailableCookies()) / oldCPS)
	};
}
PriceCalculator.prototype.FindBuildingBCIs = function (force) {
	var buildingBCIs = [];
	var bestItem = null, bestName = null;
	var timeItem = new BuyoutItem();
	var bestBCI = -1, worstBCI = -1;
	var index = 0, endIndex = 0;

	for (var i in Game.Objects) {
		var building = Game.Objects[i];

		if (building.locked)
			break;
		endIndex++;

		var info = this.CalculateBuildingBCI(building);
		//buildingBCIs.push(info.bci);
		buildingBCIs.push({ bci: info.bci, income: info.income, time: info.time, valued: false });
		if (bestBCI == -1 || info.bci < bestBCI) {
			bestBCI = info.bci;
			bestItem = info;
			bestName = building.name;
		}
		if (worstBCI == -1 || info.bci > worstBCI) {
			worstBCI = info.bci;
		}

		index++;
	}
	if (bestItem != null) {
		bestItem = new BuyoutItem(bestName, 'building', 1, bestItem.price, bestItem.bci, bestItem.income, bestItem.time);

		if (!bestItem.CanAfford()) {
			timeItem	= new BuyoutItem();
			var timeBonus	= -1;

			// Loop through every building to find the best fit
			for (var i in Game.Objects) {
				var building	= Game.Objects[i];
				var info		= this.CalculateBuildingBCI(building);

				if (building.locked)
					continue;

				// If this building can be afforded
				if (info.afford) {
					// Get the new time till the building can be bought if this building is purchased.
					var newTime = (bestItem.Price - (AvailableCookies() - info.price)) / info.cps;
					if (newTime < bestItem.Time && (timeBonus == -1 || newTime < timeBonus)) {
						timeItem	= new BuyoutItem(building.name, 'building', 1, info.price, bestItem.BCI, info.income, info.time);
						timeBonus	= newTime;
					}
				}
			}
		}
	}
	else {
		bestItem = new BuyoutItem();
	}


	CalcCookie.BuildingBCIs	= { bestItem: bestItem, timeItem: timeItem, bestBCI: bestBCI, worstBCI: worstBCI, values: buildingBCIs };
}
PriceCalculator.prototype.FindUpgradeBCIs = function (force, allowbuildings) {
	var upgradeBCIs = [];
	var bestItem = null, bestName = null;
	var bestNonResearchItem = null, bestNonResearchName = null;
	var timeItem = new BuyoutItem();
	var bestBCI = -1, worstBCI = -1;
	var bestNonResearchBCI = -1;
	var bestValued = false;

	for (var i in Game.UpgradesInStore) {
		var upgrade = Game.UpgradesInStore[i];

		if (upgrade.pool == 'toggle') {
			upgradeBCIs.push(NaN);
			continue;
		}

		var info = this.CalculateUpgradeBCI(upgrade);
		info.valued = false;
		if (upgrade.name in CalcCookie.ValuedUpgrades) {
			//info.bci = 0;
			//upgradeBCIs.push(info.bci);
			upgradeBCIs.push({ bci: info.bci, income: info.income, time: info.time, valued: true });
			//if (info.afford && !bestValued && upgrade.name != 'Chocolate egg') {
			if (AvailableCookies() * CalcCookie.ValuedUpgrades[upgrade.name] >= info.price && !bestValued && upgrade.name != 'Chocolate egg') {
				info.valued = true;
				bestItem = info;
				bestName = upgrade.name;
				bestValued = true;
			}
			continue;
		}
		//upgradeBCIs.push(info.bci);
		upgradeBCIs.push({ bci: info.bci, income: info.income, time: info.time, valued: false });
		if (isFinite(info.bci) && !isNaN(info.bci)) {
			if ((bestNonResearchBCI == -1 || info.bci * 1.0000001 < bestNonResearchBCI) && !(upgrade.name in this.Research)) {
				bestNonResearchBCI = info.bci;
				if (!bestValued) {
					bestItem = info;
					bestName = upgrade.name;
				}
				bestNonResearchItem = info;
				bestNonResearchName = upgrade.name;
			}
			if (bestBCI == -1 || info.bci * 1.0000001 < bestBCI) {
				bestBCI = info.bci;
			}
			if (worstBCI == -1 || info.bci > worstBCI) {
				worstBCI = info.bci;
			}
		}
	}
	if (bestItem != null) {
		bestItem = new BuyoutItem(bestName, 'upgrade', bestItem.valued ? 4 : 1, bestItem.price, bestItem.bci, bestItem.income, bestItem.time);

		if (!bestItem.CanAfford()) {
			timeItem = new BuyoutItem();
			var timeBonus = -1;

			// Loop through every building to find the best fit
			if (allowbuildings) {
				for (var i in Game.Objects) {
					var building = Game.Objects[i];
					var info = this.CalculateBuildingBCI(building);

					if (building.locked)
						continue;

					// If this building can be afforded
					var newTime = info.time + (bestItem.Price - (info.time > 0 ? 0 : (AvailableCookies() - info.price))) / info.cps;
					if (newTime < bestItem.Time && (timeBonus == -1 || newTime < timeBonus)) {
						timeItem = new BuyoutItem(building.name, 'building', 1, info.price, bestItem.BCI, info.income, info.time);
						timeBonus = newTime;
					}
				}
			}
			// Check if the real best upgrade will speed things up
			if (bestNonResearchItem != null) {
				//console.log(bestNonResearchName);
				var upgrade = Game.Upgrades[bestNonResearchName];
				var info = bestNonResearchItem;

				// If this building can be afforded
				var newTime = info.time + (bestItem.Price - (info.time > 0 ? 0 : (AvailableCookies() - info.price))) / info.cps;
				//console.log(timeBonus + ', ' + newTime + ', ' + timeItem.Time);
				if (newTime < bestItem.Time && (timeBonus == -1 || newTime < timeBonus)) {
					timeItem = new BuyoutItem(upgrade.name, 'upgrade', bestItem.Priority, info.price, bestItem.BCI, info.income, info.time);
					timeBonus = newTime;
				}
			}
		}
	}
	else {
		bestItem = new BuyoutItem();
	}

	CalcCookie.UpgradeBCIs = { bestItem: bestItem, timeItem: timeItem, bestBCI: bestBCI, worstBCI: worstBCI, values: upgradeBCIs };
}
PriceCalculator.prototype.FindBestResearch = function (grandmapocalypseLevel, pledge, applyCovenant) {
	var bestItem = new BuyoutItem();

	for (var i in this.Research) {
		var name = i;
		var upgrade = Game.Upgrades[name];

		if (upgrade.unlocked && !upgrade.bought) {
			//console.log(name);
			if (!(name in this.GLevels) || this.GLevels[name] <= grandmapocalypseLevel) {
				var info = this.CalculateUpgradeBCI(upgrade);
				//console.log(name);
				bestItem = new BuyoutItem(name, 'upgrade', 15, info.price, info.bci, info.income, info.time);
				break;
			}
		}
	}

	if (applyCovenant && bestItem.Type == 'invalid' && Game.season != 'halloween') {
		var upgrade = Game.Upgrades['Elder Covenant'];
		if (upgrade.unlocked && !upgrade.bought) {
			var info = this.CalculateUpgradeBCI(upgrade);
			bestItem = new BuyoutItem(upgrade.name, 'upgrade', 15, info.price, info.bci, info.income, info.time);
		}
	}

	if (pledge && bestItem.Type == 'invalid' && Game.season != 'halloween') {
		var upgrade = Game.Upgrades['Elder Pledge'];
		if (upgrade.unlocked && !upgrade.bought) {
			var info = this.CalculateUpgradeBCI(upgrade);
			bestItem = new BuyoutItem(upgrade.name, 'upgrade', 15, info.price, info.bci, info.income, info.time);
		}
	}

	CalcCookie.BestResearchItem = bestItem;
}
PriceCalculator.prototype.FindBestItem = function () {
	CalcCookie.Price.FindBuildingBCIs();
	CalcCookie.Price.FindUpgradeBCIs(true, true);

	var bestBuildingGoal = CalcCookie.BuildingBCIs.bestItem;
	var bestBuilding = CalcCookie.BuildingBCIs.bestItem;
	if (CalcCookie.BuildingBCIs.timeItem.Type != 'invalid') {
		bestBuilding = CalcCookie.BuildingBCIs.timeItem;
	}
	var bestUpgradeGoal = CalcCookie.UpgradeBCIs.bestItem;
	var bestUpgrade = CalcCookie.UpgradeBCIs.bestItem;
	if (CalcCookie.UpgradeBCIs.timeItem.Type != 'invalid') {
		bestUpgrade = CalcCookie.UpgradeBCIs.timeItem;
	}

	var bestItemGoal = bestBuildingGoal;
	if (((bestUpgradeGoal.BCI < bestBuildingGoal.BCI && bestUpgradeGoal.Priority == bestBuildingGoal.Priority) || bestUpgradeGoal.Priority > bestBuildingGoal.Priority) && bestUpgradeGoal.Type != 'invalid') {
		bestItemGoal = bestUpgradeGoal;
	}
	var bestItem = bestBuilding;
	//console.log(bestUpgrade.BCI + ', ' + bestBuilding.BCI);
	if (((bestUpgrade.BCI < bestBuilding.BCI && bestUpgrade.Priority == bestBuilding.Priority) || bestUpgrade.Priority > bestBuilding.Priority) && bestUpgrade.Type != 'invalid') {
		bestItem = bestUpgrade;
	}

	CalcCookie.BestOverallGoal = (bestItem.Name != bestItemGoal.Name ? bestItemGoal : new BuyoutItem());
	CalcCookie.BestOverallItem = bestItem;
	/*if (bestItem.Type != 'invalid') {
		if (bestItem.CanAfford()) {
			bestItem.Buy();
			//CalcCookie.Price.FindBuildingBCIs();
			CalcCookie.Price.FindBuildingBCIs();
			CalcCookie.Price.FindUpgradeBCIs();
		}
		else {
			console.log('Cant afford ' + bestItem.Name);
		}
	}*/
}

//#endregion
/*=====================================================================================
CALC COOKIE ACTION
=======================================================================================*/
//#region Action

/* The Bci-Cookie Action object. */
function CalcCookieAction(name, type, delay, func, onFunc, offFunc) {
	this.Name = name;
	this.Type = type;
	this.Enabled = false;
	this.Delay = delay;
	this.Func = func;
	this.OnFunc = onFunc;
	this.OffFunc = offFunc;
	this.ID = 0;
}
/* Calls the action. */
CalcCookieAction.prototype.Action = function (notify) {
	if (this.Type == 'toggle') {
		this.Enabled = !this.Enabled;
		if (this.Delay)
			this.ID = this.ID ? clearInterval(this.ID) : setInterval(this.Func, this.Delay);
		else
			this.Func();
		if (!this.Enabled && this.OffFunc)
			this.OffFunc();
		else if (this.Enabled && this.OnFunc)
			this.OnFunc();
	}
	else if (this.Type == 'basic') {
		this.Func();
	}
}
/* Enables the action. */
CalcCookieAction.prototype.Enable = function (notify) {
	if (this.Type == 'toggle' && !this.Enabled) {
		this.Enabled = true;
		if (this.Delay && !this.ID)
			this.ID = setInterval(this.Func, this.Delay);
		else
			this.Func();
		if (this.OnFunc)
			this.OnFunc();
	}
}
/* Disables the action. */
CalcCookieAction.prototype.Disable = function (notify) {
	if (this.Type == 'toggle' && this.Enabled) {
		this.Enabled = false;
		if (this.Delay && this.ID)
			this.ID = clearInterval(this.ID);
		else
			this.Func();
		if (this.OffFunc)
			this.OffFunc();
	}
}

//#endregion
/*=====================================================================================
CALC COOKIE VARIABLES
=======================================================================================*/

var t = new Date().getTime();
CalcCookie.Clicks = [{ clicks: 0, time: t }, { clicks: 0, time: t }, { clicks: 0, time: t }, { clicks: 0, time: t }, { clicks: 0, time: t },
					{ clicks: 0, time: t }, { clicks: 0, time: t }, { clicks: 0, time: t }, { clicks: 0, time: t }, { clicks: 0, time: t },
					{ clicks: 0, time: t }, { clicks: 0, time: t }, { clicks: 0, time: t }, { clicks: 0, time: t }, { clicks: 0, time: t }];

CalcCookie.Price = new PriceCalculator();
CalcCookie.Season = new SeasonCalculator();
CalcCookie.Dragon = new DragonCalculator();

CalcCookie.ValuedUpgrades = [];

// Important settings

CalcCookie.ClicksPerSecond = 0;
CalcCookie.BuildingBCIs	= { bestItem: new BuyoutItem(), timeItem: new BuyoutItem(), bestBCI: NaN, worstBCI: NaN, values: [] };
CalcCookie.UpgradeBCIs = { bestItem: new BuyoutItem(), timeItem: new BuyoutItem(), bestBCI: NaN, worstBCI: NaN, values: [] };
CalcCookie.BestOverallItem = new BuyoutItem();
CalcCookie.BestOverallGoal = new BuyoutItem();
CalcCookie.BestSeasonItem = new BuyoutItem();
CalcCookie.BestDragonItem = new BuyoutItem();
CalcCookie.BestResearchItem = new BuyoutItem();

CalcCookie.MaintainLucky = false;

/*=====================================================================================
CALC COOKIE ACTIONS
=======================================================================================*/

/* The list of actions. */
CalcCookie.Actions = {
	buildingbci: new CalcCookieAction('Building BCI', 'toggle', 300, CalcCookie.UpdateBuildingBCI, CalcCookie.UpdateBuildingBCI, CalcCookie.BuildingBCIOff),
	upgradebci: new CalcCookieAction('Upgrade BCI', 'toggle', 2000, CalcCookie.UpdateUpgradeBCI, CalcCookie.RefreshUpgrades, CalcCookie.RefreshUpgrades),

	clickrate: new CalcCookieAction('Update Click Rate', 'toggle', 1000, CalcCookie.UpdateClickRate)

};

/*=====================================================================================
LAUNCH CALC COOKIE
=======================================================================================*/

CalcCookie.Init();
