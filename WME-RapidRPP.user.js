// ==UserScript==
// @name         WME RapidRPP
// @version      2021.05.20.01
// @description  Rapid Residential Place Point Creator
// @include      https://www.waze.com/editor*
// @include      https://www.waze.com/*/editor*
// @include      https://beta.waze.com/editor*
// @include      https://beta.waze.com/*/editor*
// @exclude      https://www.waze.com/user/editor*
// @grant        none
// @require      https://greasyfork.org/scripts/24851-wazewrap/code/WazeWrap.js
// @require      https://greasyfork.org/scripts/38421-wme-utils-navigationpoint/code/WME%20Utils%20-%20NavigationPoint.js?version=251065
// @contributionURL https://github.com/WazeDev/Thank-The-Authors
// @license      GPLv3
// ==/UserScript==

/* global W */
/* global OpenLayers */
/* ecmaVersion 2017 */
/* global $ */
/* global I18n */
/* global _ */
/* global WazeWrap */
/* global require */
/* eslint curly: ["warn", "multi-or-nest"] */

debugger;
var UpdateObject, MultiAction;

(function() {

    var newAttributes;

    function getMousePosit(){
        var mousePosition = $('.WazeControlMousePosition').text().split(" ");
        [mousePosition[0], mousePosition[1]] = [mousePosition[1], mousePosition[0]];
        return WazeWrap.Geometry.ConvertTo900913(mousePosition[0], mousePosition[1]);
    }

    function createRPP(pos, houseNum) {
        var PlaceObject = require("Waze/Feature/Vector/Landmark");
        var AddPlace = require("Waze/Action/AddLandmark");
        var multiaction = new MultiAction();
        multiaction.setModel(W.model);

        var NewPlace = new PlaceObject();

        NewPlace.geometry = new OpenLayers.Geometry.Point(pos.lon, pos.lat);
        NewPlace._originalResidential = true;
        NewPlace.attributes.residential = true;
        let eep = new NavigationPoint(new OpenLayers.Geometry.Point(pos.lon, pos.lat));
        NewPlace.attributes.entryExitPoints.push(eep);
        NewPlace.attributes.lockRank = 2;

        W.model.actionManager.add(new AddPlace(NewPlace));
        var UpdateFeatureAddress = require('Waze/Action/UpdateFeatureAddress');
        multiaction.doSubAction(new UpdateFeatureAddress(NewPlace, newAttributes));
        
        multiaction.doSubAction(new UpdateObject(NewPlace, {houseNumber: houseNum}));

        W.model.actionManager.add(multiaction);
    }

    function getSegDetails() {
        var selSeg = W.selectionManager.getSegmentSelection();
        if (selSeg.segments.length >= 1) {
            selSeg = selSeg.segments[0];
            var address = selSeg.getAddress();

            newAttributes = {
                countryID: address.attributes.country.id,
                stateID: address.attributes.state.id,
                emptyCity: address.attributes.city.attributes.name ? null : true,
                emptyStreet: address.attributes.street.name ? null : true,
                streetName: address.attributes.street.name,
            };

            var cityName = address.attributes.city.attributes.name;
            if (cityName === "") {
                if (address.attributes.altStreets.length > 0) {
                    for(var j=0;j<selSeg.attributes.streetIDs.length;j++){
                        var altCity = W.model.cities.getObjectById(W.model.streets.getObjectById(selSeg.attributes.streetIDs[j]).cityID).attributes;

                        if(altCity.name !== null && altCity.englishName !== ""){
                            cityName = altCity.name;
                            break;
                        }
                    }
                }
            }
            if(cityName !== "") {
                newAttributes.emptyCity = null;
            }
            newAttributes.cityName = cityName;
            return true;
        } else {
            return false;
        }
    }

    function doRapidRPPplus1() {
        if (getSegDetails()) {
            var pos = getMousePosit();
            var nextElem = $('input.rapidRPP-next');
            var nextVal = nextElem.val();
            var newHN = Number(nextVal) + 1;
            nextElem.val(newHN).change();
            createRPP(pos, newHN);
        }
    }

    function doRapidRPPplus2() {
        if (getSegDetails()) {
            var pos = getMousePosit();
            var nextElem = $('input.rapidRPP-next');
            var nextVal = nextElem.val();
            var newHN = Number(nextVal) + 2;
            nextElem.val(newHN).change();
            createRPP(pos, newHN);
        }
    }

    function doRapidRPPplus4() {
        if (getSegDetails()) {
            var pos = getMousePosit();
            var nextElem = $('input.rapidRPP-next');
            var nextVal = nextElem.val();
            var newHN = Number(nextVal) + 4;
            nextElem.val(newHN).change();
            createRPP(pos, newHN);
        }
    }
    function doRapidRPPplusNext() {
        if (getSegDetails()) {
            var pos = getMousePosit();

            var incVal = parseInt($('input#rapidRPP-increment').val());
            var nextElem = $('input.rapidRPP-next');
            var nextVal = nextElem.val();
            var newHN = Number(nextVal);
            var nextHN = newHN + incVal;
            nextElem.val(nextHN).change();
            createRPP(pos, newHN);
        }
    }

    function doRapidRPP() {
        if (getSegDetails()) {
            var pos = getMousePosit();

            var sNum = Number(prompt("Please enter the starting house number"));
            var eNum = Number(prompt("Please enter the ending house number"));
            var nNum = Number(prompt("Please enter the house number spacing"));
            var sDir = prompt("(H)orizontal or (V)ertical?");

            var m = sNum;
            while (m <= eNum) {
                createRPP(pos, m);
                m += nNum;
                if (sDir.toUpperCase() == "H") {
                    pos.lat = pos.lat + 5.000000;
                } else {
                    pos.lon = pos.lon + 5.000000;
                }
            }

        } else {
            console.error("No selected segment");
        }
    }

    function addRapidRPPMenu() {
        let toolBar;
        let RapidRPPBox;

        RapidRPPBox = $('<div class="toolbar-button rapidRPP-control" style="float:left; padding-right: 3px; padding-left: 5px;"><span class="menu-title">Next #</span>' +
            '<input type="number" class="rapidRPP-next" style="margin: 3px; height:20px; width: 64px; text-align: right">' +
            '<span id="rapidRPP-input-type" style="font-size: 10px;">#</span><span id="rapidRPP-input-is-number" style="display:none">1,2,3</span><span id="rapidRPP-input-is-text" style="display:none">123,456ABC,789-321</span></div>' +
            '<div class="toolbar-button rapidRPP-control" style="float:left"><span class="menu-title" style="text-align: right">Increment</span><input type="number" name="incrementRPP" id="rapidRPP-increment" value="4" style="margin: 3px; height:20px; width: 45px; text-align: right" step="1"></div>');

        RapidRPPBox.appendTo($('[id="primary-toolbar"]')[0].children[0]);

    }

    function setupRapidRPP() {
        UpdateObject = require("Waze/Action/UpdateObject");
        MultiAction = require("Waze/Action/MultiAction");
        new WazeWrap.Interface.Shortcut('CreateRapidRPPs', 'Creates multiple resdiential Place points', 'wmerrpp', 'Rapid RPP', "A+k", function(){doRapidRPP();}, null).add();
        new WazeWrap.Interface.Shortcut('CreateRapidRPPsplusNext', 'Creates multiple resdiential Place points', 'wmerrpp', 'Rapid RPP', "h", function(){doRapidRPPplusNext();}, null).add();
        new WazeWrap.Interface.Shortcut('CreateRapidRPPsplus1', 'Creates multiple resdiential Place points', 'wmerrpp', 'Rapid RPP', "v", function(){doRapidRPPplus1();}, null).add();
        new WazeWrap.Interface.Shortcut('CreateRapidRPPsplus2', 'Creates multiple resdiential Place points', 'wmerrpp', 'Rapid RPP', "b", function(){doRapidRPPplus2();}, null).add();
        new WazeWrap.Interface.Shortcut('CreateRapidRPPsplus4', 'Creates multiple resdiential Place points', 'wmerrpp', 'Rapid RPP', "n", function(){doRapidRPPplus4();}, null).add();
        addRapidRPPMenu();
    }

    function bootstrap(tries = 1) {
        if (W &&
            W.map &&
            W.model &&
            W.loginManager.user &&
            WazeWrap.Ready)
            setupRapidRPP();
        else if (tries < 1000)
            setTimeout(function () {bootstrap(tries++);}, 200);
    }

    bootstrap();

})();