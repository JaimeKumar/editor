var fontSize = 13;
var tabSelected;
var editMode = false;
var checkinMode = false;
var globalHTML = "Something went wrong, please contact jaime@360travel.co.uk with the source of the TQ Itinerary ('view source' text).";
var checkedIn = false;
var prevCheckin;
var helpLatch = false;
var nPassengers = 1;
var ffInfo = [];
var eTickets = [];

String.prototype.goto = function(str, n=0) {
   return this.indexOf(str, n) + str.length;
}
String.prototype.count = function(str) {
   return (this.match(new RegExp(str, "g")) || []).length;
}
String.prototype.nTh = function(str, n) {
   let x = 0;
   let res = 0;
   while (x <= n) {
      res = this.goto(str, res)
      x++
   }
   return res;
}
String.prototype.clean = function(cursor) {
   return this.slice(cursor).trim('\n').slice(0, this.slice(cursor).trim('\n').indexOf('\n'))
}
String.prototype.push = function(cursor) {
   return this.slice(cursor).goto(this.clean(cursor))
}
String.prototype.find = function (what,where) {
   return this.indexOf(what,where)
}

String.prototype.capitalise = function () {
   return this.charAt(0).toUpperCase() + this.slice(1);
}

function getPosition(string, subString, index) {
  return string.split(subString, index).join(subString).length;
}

function wordify(n) {
   const words = [
      'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'
    ];
    return words[n]
}

function isLetter(str) {
  return str.match(/[A-Z]/i);
}

var textFile = null;
function makeFile(text) {
   var data = new Blob([text], {type: 'text/html'});

   // If we are replacing a previously generated file we need to
   // manually revoke the object URL to avoid memory leaks.
   if (textFile !== null) {
   window.URL.revokeObjectURL(textFile);
   }

   textFile = window.URL.createObjectURL(data);

   // returns a URL you can use as a href
   return textFile;
}

function nthIndex(str, pat, n){
    var L= str.length, i= -1;
    while(n-- && i++<L){
        i= str.indexOf(pat, i);
        if (i < 0) break;
    }
    return i;
}

function isNumber(char) {
  if (typeof char !== 'string') {
    return false;
  }

  if (char.trim() === '') {
    return false;
  }

  return !isNaN(char);
}

function convert(method) {
   var inputValue = document.getElementById("summaryInput").value;
   if (method=="sum") {
   	var outputValue = "";

   	var nLines = 1 + (inputValue.match(/\n/g)||[]).length;
    var lineStart;

   	for (var i = 0; i < nLines; i++) {
   		if (i < 1) {
   			lineStart = 0;
   		} else {
   			lineStart = getPosition(inputValue, "\n", i);
   		}

         // Get Line break positions
   		var lineEnd = getPosition(inputValue, "\n", i + 1);
   		var thisLine = inputValue.slice(lineStart, lineEnd);

         // Detect line type (GAL./WSPAN*)
         if (thisLine.includes(".")) {

            // EDIT LINE
            let foundNum = false; // use function isLetter
            let foundAlph = false; // use isNaN(char) - true if there is letter, false if isNumber (including boolean states and whitespace (0))
            let startTrim = true;
            let extractDay = false;
            let endTrim = false;
            let hsDel = false;
            let journeySpace = false;
            let alphCount = 0;
            let dayData;
            let dayDataEnd;
            let dayAdded = false;
            let carrier;
            let carrierGot = false;
            let days = 0;
            let landDay;

            // Remove #, using / in day to detect overnight
            if (thisLine.includes("#") && thisLine.includes("/")) {
               thisLine = thisLine.replace("#", " ");
               days = 1;
            } else if (thisLine.includes("*") && thisLine.includes("/")) {
               thisLine = thisLine.replace("*", " ");
               days = 2;
            }

            let dotPos = getPosition(thisLine, ".", 1);
            thisLine = thisLine.slice(dotPos + 2);

            // Parse line
            for (var j = thisLine.length - 1; j > -1; j--) {

               let isAlph = isNaN(thisLine[j]);
               let isNum = isNumber(thisLine[j]);


               if (j === thisLine.length - 1 && isNum) {
                  startTrim = false;
               }

               // Trim anything after letters
               if (!startTrim && isAlph) {
                  thisLine = thisLine.slice(0, j + 1);
                  startTrim = true;
               }
               
               if (startTrim && !foundAlph && isAlph) {
                  dayDataEnd = j+1;
                  foundAlph = true;
               }
               
               if (foundAlph && !extractDay && !isAlph) {
                  dayData = thisLine.slice(j + 1, dayDataEnd);
                  extractDay = true;
               }
               
               if (extractDay && isNum && !endTrim) {
                  thisLine = thisLine.slice(0, j + 1);

                  if (days > 0) {
                     landDay = dayData.slice(3)
                     dayData = dayData.slice(0, 2);
                  }
                  endTrim = true;
               }

               if (endTrim && !hsDel && isAlph) {
                  thisLine = thisLine.slice(0, j - 2) + thisLine.slice(j + 2);
                  hsDel = true;
               }

               if (hsDel && !journeySpace && isAlph) {
                  alphCount++;
                  if (alphCount == 4) {
                     thisLine = thisLine.slice(0, j) + " " + thisLine.slice(j);
                     journeySpace = true;
                  }
               }

               if (journeySpace && isNum && !foundNum) {
                  foundNum = true;
                  if (days > 0) {
                     if (days < 2) {
                        thisLine += " next day";
                     } else {
                        thisLine += ` - ${wordify(days)} days later`;
                     }
                  }
               }

               if (!dayAdded && foundNum && isAlph) {
                  thisLine = thisLine.slice(0, j) + " " + dayData + thisLine.slice(j + 2);
                  dayAdded = true;
               }

               if (dayAdded && !carrierGot) {
                  carrier = thisLine.slice(0, 2);
                  if (carrier == "U2") {
                     thisLine = "EZ" + thisLine.slice(2) + ' - ECONOMY CABIN ONLY';
                  } else if (carrier == "FR") {
                     thisLine = "RY" + thisLine.slice(2) + ' - ECONOMY CABIN ONLY';
                  } else if (carrier == "B6") {
                     thisLine = "JB" + thisLine.slice(2);
                  }
                  carrierGot = true;
               }

            }
            outputValue += thisLine + "\n";
         } else if (thisLine.toUpperCase().includes("/O") || thisLine.toUpperCase().includes("/X")){
            thisLine = thisLine.trim("\n");
            thisLine = thisLine.slice(1).trim();
            let slashPos = thisLine.indexOf("/");
            thisLine = thisLine.slice(0, slashPos).trim();

            // Get overnight length
            var days = 0;
            if (thisLine.includes('#')) {
               days = +thisLine.slice(thisLine.indexOf('#') + 1).trim();
               thisLine = thisLine.slice(0, thisLine.indexOf('#'));
            }

            // Add a space between TIMES
            thisLine = thisLine.slice(0, 20) + " " + thisLine.slice(20);
            thisLine = thisLine.slice(0, thisLine.length - 5) + " " + thisLine.slice(thisLine.length - 5);

            // Move day
            let daysArr = [" MO ", " TU ", " WE ", " TH ", " FR ", " SA ", " SU "];
            if (daysArr.some(day => (thisLine.includes(day) && thisLine.indexOf(day) > 0))) {
               var thisDay = thisLine.slice(13, 16);
               thisLine = thisLine.slice(0, 2) + " " + thisLine.slice(2, 6) + " " + thisDay + thisLine.slice(7, 13) + thisLine.slice(16);
            } else {
               alert('Missing day for flight: ' + thisLine.slice(0, 6));
            }

            // Remove SS1
            var ssPos;
            if (thisLine.includes(" SS")) {
               ssPos = thisLine.indexOf(" SS");
               thisLine = thisLine.slice(0, ssPos) + thisLine.slice(ssPos + 4);
            } else if (thisLine.includes(" MK")) {
               ssPos = thisLine.indexOf(" MK");
               thisLine = thisLine.slice(0, ssPos) + thisLine.slice(ssPos + 4);
            }

            // Add day info
            let dayInfo;
            let date = +thisLine.slice(12, 14);
            let month = thisLine.slice(14, 17);
            if (days > 0) {
               dayInfo = "next day";
               if (days > 1) {
                  dayInfo = "on " + (date + days) + month;
               }
               thisLine += dayInfo;
            }


            let carrier = thisLine.slice(0, 2);
            if (carrier == "U2") {
               thisLine = "EZ" + thisLine.slice(2) + ' - ECONOMY CABIN ONLY';
            } else if (carrier == "FR") {
               thisLine = "RY" + thisLine.slice(2) + " - " + 'ECONOMY CABIN ONLY';
            } else if (carrier == 'B6') {
               thisLine = "JB" + thisLine.slice(2);
            }
            
            outputValue += thisLine.trim() + "\n";


         } else if (thisLine.includes("OPERATED")) {
            if (!outputValue.includes('LCY') && !thisLine.includes('OPERATED BY BA CITY FLYER') && !thisLine.includes('OPERATED BY KLM CITYHOPPER') && !thisLine.includes('OPERATED BY EUROWINGS')) {
               outputValue = outputValue.slice(0, outputValue.length-1) + " - " + thisLine.trim() + outputValue.slice(outputValue.length-1);
            } 
         } else if (thisLine.includes("HK")) {

            var charLine = '';
            for (var j = 0; j < thisLine.length; j++) {
                var char = thisLine.charAt(j);
                if (/[a-zA-Z]/.test(char)) {
                    charLine += 'A';
                } else if (/[0-9]/.test(char)) {
                    charLine += 'N';
                } else {
                    charLine += char;
                }
            }

            var hkpos = charLine.indexOf("AA/AAN");
            thisLine = thisLine.slice(0, hkpos) + thisLine.slice(hkpos + 7);

            var destPos = charLine.indexOf("AAAAAA") + 3;
            thisLine = thisLine.slice(0, destPos) + " " + thisLine.slice(destPos);

            var lineStatus;
            if (thisLine.includes("XS ")) {
                thisLine = thisLine.replace("XS ", "");
                lineStatus = "CANCELLED";
            } else if (thisLine.includes("SC")) {
                thisLine = thisLine.replace("SC ", "");
                lineStatus = "CONFIRMED";
            }
            thisLine = thisLine.replace("O*", lineStatus);
            thisLine = thisLine.replace(" V ", " ");

            outputValue += thisLine;
         }
   	}
      document.getElementById("summaryInput").value = outputValue;
      tabSelected = "sum";
      document.getElementById("copyTab").value = "COPY";
      document.getElementById("copyTab").style.width = '12.5%';
      document.getElementById("copyTab").style.display = 'flex';
      document.getElementById("copyTab").disabled = false;
      document.getElementById("copiedStatus").style.fontWeight = "normal";
      document.getElementById("copiedStatus").style.color = "#888";
      document.getElementById("copiedStatus").style.left = "85%";
   } else if (method=="itin") {
        var itinInput = inputValue;
        
        // Cavendish Londo fix
        itinInput = itinInput.replaceAll("Londo<", "London<")
        itinInput = itinInput.replaceAll("By Hilto<", "by Hilton<")
        itinInput = itinInput.replaceAll("Garden Inn L<", "Garden Inn<")
        
        var nTK = (itinInput.match(/CF#/g) || []).length;
        var hotel = Array(nTK).fill(false);
        for (var i = 0; i < nTK; i++) {
            // CF# || CF#:
            let cfi = nthIndex(itinInput, "CF#", i+1);
            if (itinInput.slice(cfi + 3, cfi + 4) == ":") {
                hotel[i] = true;
            }
        }

        var nFl = nTK;
        var flDone = 0;

        var operatorDel = 0;

        var ff = false;

        var addSerDel = 0;
        var seatDel = 0;
        var reqDel = 0;


        var classChanges = "";

        // Name at top
        var nameAnchor = nthIndex(itinInput, "RecordLocator Begin -->", 1);
        var tdPos = itinInput.slice(nameAnchor).indexOf("<td");
        var namePos = 1 + itinInput.slice(tdPos + nameAnchor).indexOf(">");
        var nameEnd = itinInput.slice(tdPos + nameAnchor + namePos).indexOf("</td>");
        var name = itinInput.slice(tdPos + nameAnchor + namePos, tdPos + nameAnchor + namePos +  nameEnd).trim();
        name = name.replace(/,/g, " /").toUpperCase();
        name = name.replace(/\./g, "");
        
        // Name and FF
        var names = name.split("<BR />");
        nPassengers = names.length;
        var ffs = [];
        var ffCheck = [];
        spacedTitles = [' MR', ' MRS', ' MISS', ' MS', ' DR', ' MSTR'];
        name = "";
        
        for (var j = 0; j < names.length; j++) {
            let doChange = true;
            let hasTitle = false;
            if (names[j].includes("FF:")) {
                ffCheck[j] = true;
                ff = true;
                names[j] = names[j].trim("<BR />").trim();
                ffs[j] = names[j].slice(names[j].indexOf("(") + 5, -1);
                names[j] = names[j].slice(0, names[j].indexOf("(")).trim();
                names[j] = names[j].replace(/\d+/g, "");
                if (!itinInput.includes("<!-- Remove Seat Begin -->")) {
                    names[j] += " (FF: " + ffs[j] + ")";
                }
            } else {
                names[j] = names[j].replace(/\d+/g, "");
            }
            
            spacedTitles.forEach((title) => {
                if (names[j].includes(title)) {
                    doChange = false;
                }
                if (names[j].slice(-title.trim().length) == title.trim()) {
                    hasTitle = true;
                }
            });
            
            if (doChange && hasTitle) {
                // because DR is the only title that doesn't start with 'M'
                if (names[j].slice(-2) == "DR") {
                    names[j] = names[j].slice(0, -2) + ' ' + names[j].slice(-2);
                } else {
                    var n = names[j].toUpperCase().lastIndexOf('M');
                    names[j] = names[j].slice(0, n) + ' ' + names[j].slice(n);
                }
            }
            
            name += names[j] + "<br/>";
        }
        
        
        // Strong Name
        itinInput = itinInput.slice(0, tdPos + nameAnchor + namePos) + name + itinInput.slice(tdPos + nameAnchor + namePos+nameEnd);
        
        // Stops
        itinInput = itinInput.replace(/<strong>&nbsp;Stop:<\/strong> 0 /g, "");
        
        const regex = new RegExp("<strong>&nbsp;Stop:</strong>", 'g');
        const indexes = [];
        let match;
        
        while ((match = regex.exec(itinInput)) !== null) {
            indexes.push(match.index);
        }
        
        for (let i = indexes.length-1; i > -1; i--) {
            let index = indexes[i]
            let stop0 = itinInput.indexOf(">", index + 20) + 1;
            let stop1 = itinInput.indexOf("(", stop0)
            let stop2 = itinInput.indexOf("<", stop1)
            itinInput = itinInput.slice(0, index) + '<span style="color: purple;"><b>' + itinInput.slice(index, stop1) + '</b>' + itinInput.slice(stop1, stop2) + "</span>" + itinInput.slice(stop2)
        }

        // Meals
        itinInput = itinInput.replace(/<strong>&nbsp;<strong>Meals: <\/strong><\/strong> Meal /g, "");
        itinInput = itinInput.replace(/<strong>&nbsp;<strong>Meals: <\/strong><\/strong> Lunch /g, "");
        itinInput = itinInput.replace(/<strong>&nbsp;<strong>Meals: <\/strong><\/strong> Refreshments /g, "");
        itinInput = itinInput.replace(/<strong>&nbsp;<strong>Meals: <\/strong><\/strong> Dinner /g, "");
        itinInput = itinInput.replace(/<strong>&nbsp;<strong>Meals: <\/strong><\/strong> Breakfast /g, "");
        itinInput = itinInput.replace(/<strong>&nbsp;<strong>Meals: <\/strong><\/strong> Lunch, Snack or Brunch /g, "");
        itinInput = itinInput.replace(/vegetarian indian meal/g, "Asian Vegetarian Meal");

        // Baggage Allowance
        itinInput = itinInput.replace(/<strong>&nbsp;Baggage Allowance:<\/strong>  N\/A /g, "");

        // "CONFIRMED"
        itinInput = itinInput.replace(/Confirmed/g, "");

        // for each ticket
        for (var i = 0; i < nTK; i++) {
            var cfIncision = itinInput.indexOf("CF#");
            var cfEnd = itinInput.indexOf("<", cfIncision);
            if (cfIncision > 0 && cfEnd > cfIncision) {
            let incision = itinInput.slice(cfIncision, cfEnd);
            if (incision.length < 6) {
                cfEnd = itinInput.indexOf("<", cfEnd+1);
                incision = itinInput.slice(cfIncision, cfEnd);
            }
            incision = incision.replace("</strong>", "");
            itinInput = itinInput.slice(0, cfIncision) + "<strong style='color: #04b152ff'>" + incision + "</strong>" + itinInput.slice(cfEnd);
            itinInput = itinInput.replace("CF#", "REF:"); // flights dont have the colon afer CF# ...
            itinInput = itinInput.replace("::", ":"); // ... so we have to remove double colon for hotels
            itinInput = itinInput.replace("<strong><strong", "<strong");
            }
            
            //Capitalise meals
            let mealPos = nthIndex(itinInput, "<strong>Requested Services</strong>", i+1) + 40;
            let mealEnd = itinInput.indexOf("<br/>", mealPos);
            let mealArr = itinInput.slice(mealPos, mealEnd).trim().split(" ");
            console.log(mealArr);
            mealArr.forEach((word, mealIndex) => {
               mealArr[mealIndex] = word.capitalise();
            })
            let meal = mealArr.join(" ");
            console.log(meal)
            itinInput = itinInput.slice(0, mealPos) + meal + itinInput.slice(mealEnd);

            // Hotels - remove NM in bottom info
            if (hotel[i]) {
                var NMstart = itinInput.indexOf("NM:");
                var NMend = itinInput.indexOf("</td>", NMstart);
                itinInput = itinInput.slice(0, NMstart) + itinInput.slice(NMend);

                var faxStart = itinInput.indexOf("Fax:");
                var faxEnd = itinInput.indexOf("</td>", faxStart);
                itinInput = itinInput.slice(0, faxStart) + itinInput.slice(faxEnd);
            }

            // Cabin class
            if (nFl > flDone) {
                var classPos = 21 + nthIndex(itinInput, "Cabin Class:</strong>", i + 1);
                var classLength = itinInput.slice(classPos).indexOf("<strong>");
                var cabinClass = itinInput.slice(classPos, classPos + classLength);
                var classClean;
                if (cabinClass.toUpperCase().includes("BUSINESS") || cabinClass.toUpperCase().includes("BUS")) {
                    classClean = " Business ";
                } else if (cabinClass.toUpperCase().includes("FIRST")) {
                    classClean = " First ";
                } else if (cabinClass.toUpperCase().includes("ECONOMY") || cabinClass.toUpperCase().includes("COACH") || cabinClass.toUpperCase().includes("WORLD TRAVELLER") || cabinClass.toUpperCase().includes("EURO TRAVELLER") || cabinClass.toUpperCase().includes("TOURIST")) {
                    classClean = " Economy ";
                } else {
                    classClean = " " + cabinClass.trim();
                }
                itinInput = itinInput.slice(0, classPos) + classClean + itinInput.slice(classPos + classLength);

                if (cabinClass.trim() == classClean.trim()) {
                    if (classChanges.length != 0) {classChanges += " <br/><br/>";}
                    classChanges += "Class unrecognised";
                } else {
                    if (classChanges.length != 0) {classChanges += " <br/><br/>";}
                    classChanges += "Class changed: " + `"` + cabinClass.trim() + `"` + " <br/> to " + `"` + classClean + `"`;
                }
                document.getElementById("copiedStatus").style.color = "#000";
                document.getElementById("copiedStatus").style.fontWeight = "bold";
                document.getElementById("copiedStatus").innerHTML = classChanges;
                document.getElementById("copiedStatus").style.opacity = 1;
                // document.getElementById("copiedStatus").style.fontSize = "1.2rem";
                // document.getElementById("copiedStatus").style.left = "75%";
                flDone++;
            }

            // Airline / operator
            var airlinePos = 18 + nthIndex(itinInput, "Airline:<", i + 1);
            var airline = itinInput.slice(airlinePos, (airlinePos + itinInput.slice(airlinePos).indexOf(" <")));
            var operatorPos = 22 + nthIndex(itinInput, "Operated By:<", i + 1 - operatorDel);
            var operator = itinInput.slice(operatorPos, (operatorPos + itinInput.slice(operatorPos).indexOf(" <")));
            if (airline == operator) {
            itinInput = itinInput.slice(0, (airlinePos + itinInput.slice(airlinePos).indexOf("<"))) + itinInput.slice(operatorPos + itinInput.slice(operatorPos).indexOf(" <"));
            operatorDel++;
            }

            // Additional Services
            var startSerPos = nthIndex(itinInput, "<!-- Remove AdditionalServices Begin -->", i + 1 - addSerDel);
            var seatPos = 26 + nthIndex(itinInput, "<!-- Remove Seat Begin -->", i + 1 - addSerDel);
            var reqSerPos = nthIndex(itinInput, "<!-- Remove RequestedServices Begin -->", i + 1 - addSerDel - reqDel);
            var reqSerEnd = nthIndex(itinInput, "<!-- Remove RequestedServices End -->", i + 1 - addSerDel);
            var endSerPos = 38 + nthIndex(itinInput, "<!-- Remove AdditionalServices End -->", i + 1 - addSerDel);
            var seat, reqServ;

            if ((itinInput.slice(seatPos, reqSerPos).match(/None/g) || []).length >= nPassengers) {
            seat = false;
            } else {seat = true;}

            let noneReq = (itinInput.slice(reqSerPos, endSerPos).match(/None/g) || []).length;
            let childMealReq = (itinInput.slice(reqSerPos, endSerPos).match(/child meal/g) || []).length;

            if (noneReq + childMealReq >= nPassengers) {
            reqServ = false;
            } else {reqServ = true;}

            if (!ff && !seat && !reqServ) {
            itinInput = itinInput.slice(0, startSerPos) + itinInput.slice(endSerPos);
            addSerDel++;
            } else { // PASSENGER NAME SPACED TITLE
            var passengerPos = nthIndex(itinInput, ">Passengers<", i + 1);
            var tdPos = itinInput.indexOf("<td", passengerPos);
            var namePos = 1 + itinInput.indexOf(">", tdPos);
            for (var bip = 0; bip < nPassengers; bip++) {
                var nameEnd = itinInput.indexOf("<", namePos);
                var name = itinInput.slice(namePos, nameEnd);
                name = name.replace("/", " / ");
                // NAME REPLACE
                let doChangeP = true;
                spacedTitles.forEach((title) => {
                    if (name.includes(title) || !name.includes(title.trim())) {
                        doChangeP = false;
                    }
                })
                if (doChangeP) {
                    if (name.slice(-2) == "DR") {
                        name = name.slice(0, -2) + ' ' + name.slice(-2);
                    } else {
                        var n = name.toUpperCase().lastIndexOf('M');
                        if (n > -1) {
                            name = name.slice(0, n) + ' ' + name.slice(n);
                        }
                    }
                }

                itinInput = itinInput.slice(0, namePos) + name + itinInput.slice(nameEnd);
                tdPos = itinInput.indexOf("<td", nameEnd);
                namePos = 1 + itinInput.indexOf(">", tdPos);
            }
            if (!seat) {
                var seatPos = 26 + nthIndex(itinInput, "<!-- Remove Seat Begin -->", i + 1 - addSerDel);
                var reqSerPos = nthIndex(itinInput, "<!-- Remove RequestedServices Begin -->", i + 1 - addSerDel - reqDel);
                itinInput = itinInput.slice(0, seatPos) + itinInput.slice(reqSerPos);
                seatDel++;
            }
            if (!reqServ) {
                var reqSerPos = nthIndex(itinInput, "<!-- Remove RequestedServices Begin -->", i + 1 - addSerDel - reqDel);
                var reqSerEnd = nthIndex(itinInput, "<!-- Remove RequestedServices End -->", i + 1 - addSerDel);
                itinInput = itinInput.slice(0, reqSerPos) + itinInput.slice(reqSerEnd);
                reqDel++;
            }
            }

            if (ff && itinInput.includes("<!-- Remove Seat Begin -->")) {
            var ffCreate = "";
            let nth = hotel.slice(0, i).filter(v => v == false).length;
            var ffIncision = 26 + nthIndex(itinInput, "<!-- Remove Seat Begin -->", nth + 1 - addSerDel);
            ffCreate = itinInput.slice(0, ffIncision) + `<td style="word-break: break-word;
            -webkit-hyphens: auto; -moz-hyphens: auto; hyphens: auto;
            border-collapse: collapse !important; vertical-align: top; text-align: left;
            color: #555555; font-family: 'Helvetica', 'Arial', sans-serif; font-weight: normal;
            line-height: 19px; font-size: 14px; margin: 0; padding: 5px; width: 250px;">
            <strong>Frequent Flyer</strong><br />
            <table><tr height='19px'><td style='color: #555; font-size: 14px;'>`;
            for (var j = 0; j < nPassengers; j++) {
                if (ffCheck[j] == true) {
                    var tempPos, tempClose, ffOutput, imgFind, imgTemp, imgEnd;
                    if (ffs[j].includes(" - ")) {
                        let tempFFS = ffs[j].split(" - ");
                        tempPos = nthIndex(itinInput, "REF:", i + 1);
                        tempClose = 2 + itinInput.indexOf(`">`, tempPos-110);
                        tempOpen = itinInput.indexOf('<', tempClose);
                        imgFind = itinInput.indexOf('<img', tempOpen);
                        imgTemp = itinInput.indexOf('<br', imgFind);
                        imgEnd = 1 + itinInput.indexOf('>', imgTemp);

                        let flightNum = itinInput.slice(tempClose, tempOpen);
                        let img = itinInput.slice(imgFind, imgEnd);
                        ffOutput = "FFNUM" + i;
                        ffInfo[i] = {fl: flightNum, img: img, ffs: tempFFS};

                    } else {ffOutput = ffs[j]};
                    ffCreate += ffOutput + `<br/></td></tr>`;
                } else {
                    ffCreate += `<br/></td></tr>`;
                }
                if (j != nPassengers-1) {
                    ffCreate += `<tr height='19px'><td style='color: #555; font-size: 14px;'>`;
                }
            }
            ffCreate += "</table></td>" + itinInput.slice(ffIncision);
            itinInput = ffCreate;
            }
        }

        if (ffs.length < 1) {
            document.getElementById('noFF').style.opacity = 1;
            document.getElementById('noFF').style.pointerEvents = "All";
        }
        
        globalHTML = itinInput;
        ffLoop(0);
   } else if (method==='euro') {
      if (!inputValue.toUpperCase().includes('BOOKING REFERENCE:')) return;  

      console.log('hey')

      let refString = "Booking Reference:";
      let refStart = inputValue.toUpperCase().goto(refString.toUpperCase());
      let refEnd = inputValue.indexOf('\n', refStart);
      let ref = inputValue.slice(refStart, refEnd).trim();

      const dirs = ['Outbound', 'Return']
      let nTickets = inputValue.count('Outbound') + inputValue.count('Return');
      let nPassengers = inputValue.count('Coach') / nTickets;
      let tickets = [];

      for (var i = 0; i < nTickets; i++) {
         tickets[i] = {
            class: '', 
            date: '', 
            departure: '',
            destination: '',
            depTime: '',
            arrTime: '',
            duration: ''
         }

         let cursor = inputValue.nTh(dirs[i%2], i/2)

         Object.keys(tickets[i]).forEach(key => {
            tickets[i][key] = inputValue.clean(cursor)
            cursor += inputValue.push(cursor)
         })

         tickets[i].duration = tickets[i].duration.replace('Direct', '<b>Direct</b>')
         tickets[i].dir = dirs[i%2]
         tickets[i].passengers = []
         tickets[i].seats = []

         for (var k = 0; k < nPassengers; k++) {
            tickets[i].passengers[k] = inputValue.clean(cursor)
            cursor += inputValue.push(cursor)
            tickets[i].seats[k] = inputValue.clean(cursor)
            cursor += inputValue.push(cursor)

         }
      }

      let ticketsHTML = `<!DOCTYPE html>
                        <html lang="en">
                        <head>
                           <meta charset="UTF-8">
                           <meta name="viewport" content="width=device-width, initial-scale=1.0">
                           <style>
                              * {
                                    box-sizing: border-box;
                                    padding: 0%;
                                    margin: 0%;
                                    font-family: Arial, Helvetica, sans-serif;
                              }
                        
                              body {
                                    width: 100%;
                                    padding: 20px;
                                    z-index: -3;
                                    position: relative;
                              }
                        
                              p {
                                    font-size: 10.5pt;
                              }
                        
                              .header {
                                    width: 600px;
                                    background-color: #00286A;
                                    height: 60px;
                                    display: flex;
                                    align-items: center;
                                    padding: 20px;
                                    margin-bottom: 20px;
                              }
                        
                              .banner {
                                    width: 600px;
                                    height: 128px;
                                    background-color: #E7F0FF;
                                    color: #00286A;
                                    font-size: 21pt;
                                    font-weight: bold;
                                    text-align: center;
                              }
                        
                              .message {
                                    font-size: 10.5pt;
                                    color: #1c1c1a;
                                    text-align: left;
                                    width: 600px;
                                    padding: 60px 20px;
                              }
                        
                              .refBox {
                                    background-color: #f2f2f2;
                                    color: #00286A;
                                    width: 600px;
                                    height: 40px;
                                    text-align: center;
                                    font-size: 13.5pt;
                              }
                              
                              .tickets {
                                    background-color: #f2f2f2;
                                    width: 600px;
                                    padding: 20px;
                                    margin-top: 20px;
                              }
                        
                              .ticketsInner {
                                    background-color: white;
                                    padding: 15px;
                              }
                        
                              .row {
                                    display: flex;
                                    width: 100%;
                                    column-gap: 15px;
                                    position: relative;
                                    align-items: center;
                                    margin: 10px 0 40px 0;
                              }
                        
                              h1 {
                                    font-size: 18pt;
                                    margin: 0;
                                    font-weight: bold;
                              }
                        
                              h2 {
                                    font-size: 13.5pt;
                                    font-weight: bold;
                              }
                        
                              h3 {
                                    font-size: 12pt;
                                    font-weight: bold;
                                    margin: 10px 0;
                              }
                        
                              .classBox {
                                    background-color: #414141;
                                    height: 30px;
                                    color: white;
                                    text-align: center;
                              }
                        
                              hr {
                                    margin: 20px 0;
                              }
                        
                              .split {
                                    padding: 10px;
                                    width: 50%;
                                    height: 100%;
                              }
                        
                              .split img {
                                    width: 100%;
                              }
                        
                              .split section {
                                    width: 100%;
                                    height: 95%;
                                    background-color: white;
                                    padding: 20px;
                              }
                        
                              ul {
                                    /* margin: 8px 0 0 25px; */
                                    font-size: 10.5pt;
                              }
                        
                              li {
                                    margin: 5px 0;
                              }
                        
                              .footer {
                                    background-color: #00286A;
                                    text-align: center;
                                    z-index: -2;
                              }
                        
                              .footer p {
                                    color: white;
                                    font-size: 9pt;
                              }
                        
                              .footer a {
                                    color: white;
                                    text-decoration: none;
                              }
                        
                              a {
                                    cursor: pointer;
                              }
                        
                           </style>
                        </head>
                           <body>
                              <table cellspacing="0" width="100%">
                                    <tr>
                                       <td></td>
                                       <td width="600" style="background-color: #00286A; padding: 10px;">
                                          <img width="140" height="32" style="width:1.4583in;height:.3333in" id="_x0000_i1044" src="https://static.eurostar.com/email/shared/img/header/header-eurostar-logo.png" alt="Image">
                                       </td>
                                       <td></td>
                                    </tr>
                                    <tr>
                                       <td></td>
                                       <td class="banner">
                                          Good news, you're all booked
                                       </td>
                                       <td></td>
                                    </tr>
                                    <tr>
                                       <td></td>
                                       <td class="message">
                                          <p>Your reservation is confirmed.</p>
                                          <br>
                                          <p>We hope to see you on board soon,</p>
                                          <p>The Eurostar team</p>
                                       </td>
                                       <td></td>
                                    </tr>
                                    <tr>
                                       <td></td>
                                       <td class="refBox">
                                          Booking Reference: <b>${ref}</b>
                                       </td>
                                       <td></td>
                                    </tr>
                                    <tr>
                                       <td></td>
                                       <td><br><br></td>
                                       <td></td>
                                    </tr>
                                    <tr>
                           <td></td>
                           <td class="tickets" width="580">
                              
                        `
      tickets.forEach((ticket, j) => {
            ticketsHTML += `
                     <table width="580" style="background-color: white;">
                        <tr>
                              <td>&nbsp;</td>
                        </tr>
                        <tr>
                              <td>
                                 <table width="580">
                                    <tr>
                                       <td width="10"></td>
                                       <td>
                                          <table>
                                             <tr>
                                                <td>
                                                   <img width="29" height="24" style="width:.302in;height:.25in" id="_x0000_i1042" src="https://static.eurostar.com/email/shared/img/booking-journey/train-A-${ticket.dir.toLowerCase()}.png" alt="Image">
                                                </td>
                                                <td width="10"></td>
                                                <td>
                                                   <h1>${ticket.dir}</h1>
                                                </td>
                                             </tr>
                                          </table>
                                       </td>
                                        <td class="classBox" width="150">
                                            ${ticket.class}
                                        </td>
                                        <td width="10"></td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                        </tr>
                        <tr>
                            <td>
                                <table>
                                    <tr>
                                        <td width="10"></td>
                                        <td>
                                            <h2>${ticket.date}</h2>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                        </tr>
                        <tr>
                            <td>
                                <table>
                                    <tr>
                                        <td width="10"></td>
                                        <td>
                                            <h3>${ticket.departure}</h3>
                                            <h1>${ticket.depTime}</h1>
                                        </td>
                                        <td width="10"></td>
                                        <td width="130">
                                            <img width="110" height="4" style="width:1.1458in;height:.0416in; margin: 0 5px;" id="_x0000_i1041" src="https://static.eurostar.com/email/shared/img/0-changes-journey-arrow.png" alt="Image">
                                        </td>
                                        <td>
                                            <h3>${ticket.destination}</h3>
                                            <h1>${ticket.arrTime}</h1>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <table>
                                    <tr>
                                        <td width="10"></td>
                                        <td>
                                            <p>${ticket.duration}</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <table width="580">
                                    <tr>
                                        <td width="10"></td>
                                        <td><hr></td>
                                        <td width="10"></td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <table width="580">
               `
               
               for (var i = 0; i < ticket.passengers.length; i++) {
                  ticketsHTML += `
                                    <tr>
                                        <td width="10"></td>
                                        <td>
                                            <p>${ticket.passengers[i]}</p>
                                        </td>
                                        <td style="text-align: right;">
                                            <p>${ticket.seats[i]}</p>
                                        </td>
                                        <td width="10"></td>
                                    </tr>`
               }

               ticketsHTML += `</table>
                           </td>
                     </tr>
                     <tr>
                           <td>&nbsp;</td>
                     </tr>
                  </table>`

               if (j < tickets.length -1) {
                  ticketsHTML += '<br/>'
               }

            })
            ticketsHTML += `
            </td>
            <td></td>
         </tr>
         <tr>
            <td></td>
            <td><br><br></td>
            <td></td>
         </tr>
         <tr>
            <td></td>
            <td class="tickets" width="580">
               <table width="580" cellspacing="0">
                  <tr style="background-color: white;">
                        <td>
                           <img width="290" style="display: block;" src="https://static.eurostar.com/email/shared/img/app/welcome.png">
                        </td>
                        <td style="padding: 0 15px;">
                           <table width="100%">
                              <tr>
                                    <td>
                                       <h2 style="color: #00286A;">
                                          Get the Eurostar app
                                       </h2>
                                    </td>
                              </tr>
                              <tr>
                                    <td>
                                       <ul>
                                          <li>Train updates and travel alerts</li>
                                          <li>Easy access to tickets</li>
                                          <li>Manage your trip on the go</li>
                                          <li>Be the first to know about offers and deals</li>
                                       </ul>
                                    </td>
                              </tr>
                              <tr>
                                    <td>&nbsp;</td>
                              </tr>
                              <tr>
                                    <td style="text-align: center;">
                                       <a href="https://dyh4wwf.r.eu-west-1.awstrack.me/L0/https:%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid=com.eurostar.androidapp/1/0102018b1a76bb5e-346e37b7-ebb0-46e5-a198-8d1fa886be96-000000/z97W5qHpSxlj-u38fFairTHcfNU=343" target="_blank">
                                          <img width="220" height="39" src="https://static.eurostar.com/email/shared/img/app/google-play.png" alt="Image">
                                       </a>
                                    </td>
                              </tr>
                              <tr>
                                    <td>&nbsp;</td>
                              </tr>
                              <tr>
                                    <td style="text-align: center;">
                                       <a href="https://dyh4wwf.r.eu-west-1.awstrack.me/L0/https:%2F%2Fapps.apple.com%2Fgb%2Fapp%2Feurostar-trains%2Fid453671246/1/0102018b1a76bb5e-346e37b7-ebb0-46e5-a198-8d1fa886be96-000000/HTaQ_rxfY4KxJR75xdxpOcTPqbE=343" target="_blank">
                                          <img width="220" height="39" src="https://static.eurostar.com/email/shared/img/app/app-store.png" alt="Image">
                                       </a>
                                    </td>
                              </tr>
                              <tr>
                                    <td>&nbsp;</td>
                              </tr>
                           </table>
                        </td>
                  </tr>
               </table>
            </td>
            <td></td>
         </tr>
         <tr>
            <td></td>
            <td><br><br></td>
            <td></td>
         </tr>
         <tr>
            <td></td>
            <td>
               <table class="footer" cellspacing="0" width="624" style="overflow: hidden;">
                  <tr style="background-color: #106DFF;">
                        <td>&nbsp;</td>
                  </tr>
                  <tr style="background-color: #106DFF;">
                        <td>&nbsp;</td>
                  </tr>
                  <tr style="background-color: #106DFF;">
                        <td>
                           <h2 style="color: white; margin: 0; z-index: 1000; position: relative;">Got a question?</h2>
                           <br>
                           <p style="font-size: 12pt; margin: 0; z-index: 1000; position: relative;">Visit our <a style="text-decoration: underline;" href="https://help.eurostar.com/?language=uk-en">Help Centre</a> for more info.</p>
                        </td>
                  </tr>
                  <tr style="background-color: #106DFF;">
                        <td>&nbsp;</td>
                  </tr>
                  <tr style="background-color: #106DFF;">
                        <td>&nbsp;</td>
                  </tr>
                  <tr>
                        <td>&nbsp;</td>
                  </tr>
                  <tr>
                        <td>&nbsp;</td>
                  </tr>
                  <tr>
                        <td>
                           <table width="100%">
                              <tr>
                                    <td width="150"></td>
                                    <td width="30">
                                       <a width="30" href="https://dyh4wwf.r.eu-west-1.awstrack.me/L0/https:%2F%2Fwww.instagram.com%2Feurostar/1/0102018b1a76bb5e-346e37b7-ebb0-46e5-a198-8d1fa886be96-000000/k4rDKRtSdy0yuT2gjczT4zhQaNg=343">
                                          <img width="30" src="https://static.eurostar.com/email/shared/img/footer/instagram.png" alt="">
                                       </a>
                                    </td>
                                    <td width="20"></td>
                                    <td width="30">
                                       <a width="30" href="https://dyh4wwf.r.eu-west-1.awstrack.me/L0/https:%2F%2Fmetropolitan-eurostar.com/1/0102018b1a76bb5e-346e37b7-ebb0-46e5-a198-8d1fa886be96-000000/Ae2_gvUuf3MrOjYYXODHSJKUKUY=343">
                                          <img width="30" src="https://static.eurostar.com/email/shared/img/footer/medium.png" alt="">
                                       </a>
                                    </td>
                                    <td width="20"></td>
                                    <td width="30">
                                       <a width="30" href="https://dyh4wwf.r.eu-west-1.awstrack.me/L0/https:%2F%2Ftwitter.com%2FEurostar/1/0102018b1a76bb5e-346e37b7-ebb0-46e5-a198-8d1fa886be96-000000/mtNQC3YnU3oU3B1oDhogePiNPzQ=343">
                                          <img width="30" src="https://static.eurostar.com/email/shared/icons/twitter-x.png" alt="">
                                       </a>
                                    </td>
                                    <td width="20"></td>
                                    <td width="30">
                                       <a width="30" href="https://dyh4wwf.r.eu-west-1.awstrack.me/L0/https:%2F%2Fwww.facebook.com%2Fsharer%2Fsharer.php%3Fu=https:%2F%2Fwww.facebook.com%2Feurostar/1/0102018b1a76bb5e-346e37b7-ebb0-46e5-a198-8d1fa886be96-000000/OjlVomJzO9Gmm5GUWkkE8Dst3sU=343">
                                          <img width="30" src="https://static.eurostar.com/email/shared/img/footer/facebook.png" alt="">
                                       </a>
                                    </td>
                                    <td width="150"></td>
                              </tr>
                           </table>
                        </td>
                  </tr>
                  <tr>
                        <td>&nbsp;</td>
                  </tr>
                  <tr>
                        <td>&nbsp;</td>
                  </tr>
                  <tr>
                        <td>&nbsp;</td>
                  </tr>
                  <tr>
                        <td>
                           <img width="140" height="32" style="width:1.4583in;height:.3333in" id="_x0000_i1044" src="https://static.eurostar.com/email/shared/img/header/header-eurostar-logo.png" alt="Image">
                        </td>
                  </tr>
                  <tr>
                        <td>&nbsp;</td>
                  </tr>
                  <tr>
                        <td>&nbsp;</td>
                  </tr>
                  <tr>
                        <td>
                           <p><a href="https://eurostar.com/uk-en/privacy-policy">Privacy Policy</a> | <a href="https://eurostar.com/uk-en/contact-us/eurostar-contact-details">Contact us</a></p>
                        </td>
                  </tr>
                  <tr>
                        <td>&nbsp;</td>
                  </tr>
                  <tr>
                        <td>
                           <table style="text-align: center;">
                              <tr>
                                    <td width="20"></td>
                                    <td>
                                       <p>You’ve been sent this email by Eurostar International Limited. Part 6th Floor, Kings Place, 90 York Way, London N1 9AG. Registration number 02462001.</p>
                                    </td>
                                    <td width="20"></td>
                              </tr>
                           </table>
                        </td>
                  </tr>
                  <tr>
                        <td>&nbsp;</td>
                  </tr>
                  <tr>
                        <td>
                           <p>Copyright © 2023 Eurostar International Ltd. All Rights reserved.</p>
                        </td>
                  </tr>
                  <tr>
                        <td>&nbsp;</td>
                  </tr>
                  <tr>
                        <td>&nbsp;</td>
                  </tr>
               </table>
            </td>
            <td></td>
         </tr>
         </table> 
         </body>
         </html>`
      
      document.querySelector("iframe").src = makeFile(ticketsHTML);
      document.querySelector("textarea").value = "";
      document.getElementById("iframeContainer").style.visibility = "visible";
   } else if (method==='rail') {
      if (!inputValue.includes('eTicket Reference')) return;
      let tickets = [];
      let cursor = 0;
      cursor = inputValue.goto('eTicket Reference');
      
      let refLine = inputValue.clean(cursor)
      cursor = inputValue.goto(':', cursor);
      let refs = inputValue.clean(cursor)
      let nJourneys = inputValue.count('Journey:')
      let nPassengers = refs.split(',').length / nJourneys;
      let passengers = []
      let wallet = inputValue.toLowerCase().includes('wallet');

      if (wallet) {
         let start = inputValue.goto('Dear');
         var addressee = inputValue.slice(start, inputValue.find(',', start)).trim();
         var p = inputValue.slice(start, inputValue.indexOf('Order Summary')).split('\n');
         while (p[p.length-1].trim() === '') {
            p.pop()
         } 
      }

      cursor = inputValue.goto('Railcard', cursor)
      for (var j = 0; j < nPassengers; j++) {
         let thisPass = inputValue.clean(cursor).split('\t');
         if (!wallet || thisPass[0] === addressee) {
            passengers.push({name: thisPass[0], type: thisPass[1]})
         }
         cursor += inputValue.push(cursor)
      }

      if (wallet) {
         cursor = inputValue.goto('eTicket Details');
         const addeTicket = (n) => {
            let thisLine = inputValue.clean(cursor).split('\t');
            eTickets.push({dir: thisLine[0], ref: thisLine[1]})
            cursor += inputValue.push(cursor)
            cursor += inputValue.push(cursor)
            if (inputValue.clean(cursor).includes('Journey')) {
               return
            } else {
               addeTicket(n+1)
            }
         }
         addeTicket(0)
      }

      for (var k = 0; k < eTickets.length; k++) {
         eTickets[k].link = prompt(`Enter link for eTicket ${eTickets[k].ref}`)
      }

      if (wallet) cursor = inputValue.indexOf('Outbound Journey:');
      
      for (var i = 0; i < nJourneys; i++) {
         tickets.push({journey: inputValue.clean(cursor), stops: []})
         cursor = inputValue.goto(tickets[i].journey, cursor)
         
         let journeyInfo = inputValue.clean(cursor).split('\t')
         tickets[i].travelOn = journeyInfo[0]
         tickets[i].ticketType = journeyInfo[1]
         tickets[i].route = journeyInfo[2]

         if (wallet) {
            cursor = inputValue.goto('Ticket valid for travel', cursor)
            tickets[i].whichvalid = inputValue.clean(cursor);
            cursor = inputValue.goto(':', cursor)
            tickets[i].valids = inputValue.clean(cursor);
         }

         cursor = inputValue.goto('Seat Reservation', cursor)

         const getStops = (n) => {
            let details = inputValue.clean(cursor).split('\t')
            tickets[i].stops[n] = {};
            tickets[i].stops[n].depTime = details[0];
            tickets[i].stops[n].arrTime = details[1];
            tickets[i].stops[n].operator = details[2];
            
            cursor += inputValue.push(cursor);
            tickets[i].stops[n].seat = inputValue.clean(cursor);
            
            cursor += inputValue.push(cursor);
            tickets[i].stops[n].bottomMsg = inputValue.clean(cursor);
            cursor += inputValue.push(cursor);

            
            let nextLine = inputValue.slice(cursor, cursor + inputValue.push(cursor));
            if (nextLine.includes('Journey') || nextLine.includes('cheapest fare') || nextLine.includes('For full terms')) {
               return
            } else {
               getStops(n+1)
            }
         }
         
         getStops(0)
      }

      let globalHTML = `
      <!DOCTYPE html>
         <html lang="en">
            <head>
               <meta charset="UTF-8">
               <meta name="viewport" content="width=device-width, initial-scale=1.0">
               <title>Document</title>
               <style>
                  * {
                     box-sizing: border-box;
                     margin: 0;
                     font-family: 'Calibri', sans-serif;
                  }

                  .subTable {
                        background-color: #eee;
                        padding: 4px;
                  }

                  th {
                        text-align: start;
                  }

                  .gappy {
                        border-right: 2px solid #eeeeee00
                        border-bottom: 4px solid #eeeeee00;
                  }

                  .wallet {
                     background-color: rgb(255, 187, 0);
                     text-align: center;
                     border-radius: 5px;
                  }

                  h3 {
                        font-size: 13pt;
                  }

                  p, td {
                        font-size: 9pt;
                  }

                  b {
                        font-size: 11pt;
                  }

               </style>
            </head>
            <body>
               <table width="100%" cellspacing="10">
                  <tr>
                     <td></td>
                     <td width="600">&nbsp;</td>
                     <td></td>
                  </tr>
                  <tr>
                     <td></td>
                     <td width="600"><h3>Rail Booking Confirmation</h3></td>
                     <td></td>
                  </tr>
                  <tr>
                     <td></td>
                     <td width="600" class="subTable"><h3>eTicket Reference${refLine}</h3></td>
                     <td></td>
                  </tr>
                  ${wallet?`
                     <tr>
                        <td></td>
                        <td width="600">
                           ${p.join(`<br>`)}
                        </td>
                        <td></td>
                     </tr>
                  `:``}
                  <tr>
                     <td></td>
                     <td width="600" class="subTable">
                        <table width="100%">
                           <tr style="border-bottom: 1px solid #000;">
                              <td class="gappy"><b>Traveller Details</b></td>
                              <td class="gappy"></td>
                           </tr>
                           <tr>
                              <td class="gappy"><b>Name</b></td>
                              ${wallet?``:`<td class="gappy"><b>Type</b></td>`}
                           </tr>
      `

      for (var j = 0; j < passengers.length; j++) {
         globalHTML += `
                           <tr>
                              <td class="gappy">${passengers[j].name}</td>
                              ${wallet?``:`<td class="gappy">${passengers[j].type}</td>`}
                           </tr>
                        `
      }

      globalHTML += `
                        </table>
                     </td>
                     <td></td>
                  </tr>
               `

      if (wallet) {
         globalHTML += `
            <tr>
               <td></td>
               <td class="subTable">
                  <table width="100%">
                     <tr style="border-bottom: 1px solid #000;">
                           <td class="gappy"><b>eTicket Details</b></td>
                           <td class="gappy"></td>
                           <td class="gappy"></td>
                     </tr>`
         for (var k = 0; k < eTickets.length; k++) {
            globalHTML += `
               <tr>
                     <td class="gappy">${eTickets[k].dir}</td>
                     <td class="gappy">${eTickets[k].ref}</td>
                     <td class="gappy wallet"><a href="${eTickets[k].link}">Add to Wallet</a></td>
               </tr>
            `
         }

         globalHTML += `
                  </table>
               </td>
               <td></td>
         </tr>
         `
      }

      for (var i = 0; i < nJourneys; i++) {
         globalHTML += `
                  <tr>
                     <td></td>
                     <td width="600" class="subTable">
                        <table width="100%">
                           <tr>
                                 <td class="gappy"><b>${tickets[i].journey}</b></td>
                           </tr>
                           <tr>
                                 <td class="gappy">
                                    <table width="100%">
                                       <tr>
                                             <td>${tickets[i].travelOn}</td>
                                             <td>${tickets[i].ticketType}</td>
                                             <td>${tickets[i].route}</td>
                                       </tr>
                                    </table>
                                 </td>
                           </tr>
                           ${wallet?`
                              <tr>
                                 <td class="gappy"></td>
                              </tr>
                              <tr>
                                 <td class="gappy">Ticket valid for travel ${tickets[i].whichvalid}</td>
                              </tr>
                              <tr>
                                 <td class="gappy"></td>
                              </tr>
                              <tr>
                                 <td class="gappy">${tickets[i].valids}</td>
                              </tr>
                           `:``}
                        </table>
                     </td>
                     <td></td>
                  </tr>
                  <tr>
                     <td></td>
                     <td width="600" class="subTable">
                        <table width="100%" style="row-gap: 10px;">
                           <tr>
                                 <th class="gappy">Departs</th>
                                 <th class="gappy">Arrives</th>
                                 <th class="gappy">Operator</th>
                                 <th class="gappy">Seat reservation</th>
                           </tr>
                           <tr>
                                 <td colspan="4">
                                    <hr>
                                 </td>
                           </tr>

         `
         for (var j = 0; j < tickets[i].stops.length; j++) {
            globalHTML += `
                  <tr>
                     <td class="gappy">${tickets[i].stops[j].depTime}</td>
                     <td class="gappy">${tickets[i].stops[j].arrTime}</td>
                     <td class="gappy">${tickets[i].stops[j].operator}</td>
                     <td class="gappy">${tickets[i].stops[j].seat}</td>
                  </tr>
                  <tr>
                        <td></td>
                        <td style="border-top: 4px solid #eeeeee00; border-bottom: 4px solid #eeeeee00;" colspan="2">
                        <i style="font-size: 8pt;">${tickets[i].stops[j].bottomMsg}</i>
                        </td>
                        <td></td>
                  </tr>
               `
            if (j < tickets[i].stops.length-1) {
               globalHTML += `
                  <tr>
                        <td colspan="4">
                           <hr>
                        </td>
                  </tr>
               `
            }
         }

         globalHTML += `
               </table>
               </td>
               <td></td>
            </tr>
         `
      }



      globalHTML += `
                  <tr>
                     <td></td>
                     <td width="600" style="border-top: 3px solid #ffffff00;">
                        <p>For full terms and conditions of travel, please refer to the National Conditions of Travel on the <a href="http://www.nationalrail.co.uk/NRCOT">National Rail Website</a>.</p>
                        <p class="gappy">&nbsp;</p>
                        <p>Please do not respond to this email, it has been automatically generated by the Evolvi system. If you have any queries, please contact Harridge Business Travel on 020 8280 2500 or email <a href="mailto:reservations@harridgegroup.com">reservations@harridgegroup.com</a></p>
                        <p class="gappy">&nbsp;</p>
                        <h3 style="text-align: center;">NOT VALID FOR TRAVEL</h3>
                     </td>
                     <td></td>
                  </tr>
               </table>
            </body>
         </html>
      `

      document.querySelector("iframe").src = makeFile(globalHTML);
      document.querySelector("textarea").value = "";
      document.getElementById("iframeContainer").style.visibility = "visible";   
   }
}

function openTabs() {
   var tabs = ["sumTab", "helpTab", "euroTab", "railTab", "hotelTab", "itinTab"];

   tabs.forEach(id => {
      document.getElementById(id).style.width = "15%";
      document.getElementById(id).style.display = "flex";
      document.getElementById(id).style.margin = "5px 0px 5px 0px";
   })
}

function clearArea() {
   document.getElementById('noFF').style.opacity = 0;
   document.getElementById('noFF').style.pointerEvents = "None";
   openTabs();
   document.getElementById("copyFrame").innerHTML = "";
   document.getElementById("iframeContainer").style.visibility = "hidden";
   document.querySelector("textarea").value = "";
   document.querySelector("textarea").style.fontSize = fontSize + "pt";
   document.getElementById("copyTab").disabled = true;
   document.getElementById("checkin").disabled = true;
   document.getElementById("copyTab").style.display = 'none';
   document.getElementById("copyTab").style.width = 0;
   document.getElementById("checkin").style.width = 0;
   document.getElementById("checkin").style.display = 'none';
   
   document.getElementById("copiedStatus").style.opacity = 0;
   document.getElementById("copiedStatus").style.fontWeight = "normal";
   document.getElementById("copiedStatus").style.color = "#888";
   eTickets = [];
   
   checkedIn = false;
   ffInfo = [];
   hideHelp();
}

function ffLoop(i) {
   if (i < ffInfo.length) {
      ffDialogue(ffInfo[i], i);
   } else {
      document.getElementById('ffDialogue').style.pointerEvents = "none";
      document.getElementById('ffDialogue').style.visibility = "hidden";
      document.querySelector("iframe").src = makeFile(globalHTML);
      document.querySelector("textarea").value = "";
      document.getElementById("iframeContainer").style.visibility = "visible";
      document.getElementById("copyTab").style.width = '12.5%';
      document.getElementById("copyTab").style.display = 'flex';
      document.getElementById("copyTab").disabled = false;
      document.getElementById("checkin").style.width = '12.5%';
      document.getElementById("checkin").style.display = 'flex';
      document.getElementById("checkin").disabled = false;
      tabSelected = "itin";
      document.getElementById("copyTab").value = "EDIT";
   }
}

function ffDialogue(data, ind) {
   document.getElementById('ffDialogue').style.visibility = "visible";
   document.getElementById('ffDialogue').style.pointerEvents = "all";
   let inner = 'Select Frequent flyer number for the following flight:<br /><br />' + data.fl + '<br />' + data.img + '<br />';
   for (var i = 0; i < data.ffs.length; i++) {
      inner += `<br/><button type="button" class="ffButton" onclick="ffSelect('` + data.ffs[i] + `', ` + ind + ')">' + data.ffs[i] + '</button>';
   }
   inner += `<br/><button type="button" class="ffButton" onclick="ignoreFF(${ind})">None</button>`
   document.getElementById('ffBox').innerHTML = inner;
};

function ffSelect(select, ind) {
   let id = 'FFNUM' + ind;
   globalHTML = globalHTML.replace(id, select);
   ffLoop(ind + 1);
}

function ignoreFF(ind) {
   let feeler = globalHTML.indexOf(`FFNUM${ind}`) - 600;
   let start = globalHTML.indexOf('<!-- Remove Seat Begin -->', feeler) + 26;
   let end = globalHTML.indexOf('</td></tr></table></td>', start) + 23;
   
   let reqFeeler = globalHTML.indexOf(`FFNUM${ind}`) - 2000;
   let reqStart = globalHTML.indexOf('<!-- Remove AdditionalServices Begin -->', reqFeeler) + 40;
   let reqEnd = globalHTML.indexOf('<!-- Remove AdditionalServices End -->', reqStart)

   if (reqEnd - reqStart < 1800) {
      globalHTML = globalHTML.slice(0, reqStart) + globalHTML.slice(reqEnd)
   } else {
      globalHTML = globalHTML.slice(0, start) + globalHTML.slice(end)
   }

   ffLoop(ind+1)
}

function eTickSubmit(ref) {
   for (var i = 0; i < eTickets.length; i++) {
      if (eTickets[i].ref === ref) {
         globalHTML.replace('eTickLink' + i, document.getElementById('eTickInput').value)
         document.getElementById('eTickInput').value = '';
      }

      if (i === eTickets.length-1) {
         document.getElementById('ffDialogue').style.visibility = "hidden";
         document.getElementById('ffDialogue').style.pointerEvents = "none";
         document.getElementById('ffBox').innerHTML = '';
         document.querySelector("iframe").src = makeFile(globalHTML);
         document.querySelector("textarea").value = "";
         document.getElementById("iframeContainer").style.visibility = "visible";   
      } else {
         eTickLink(i+1)
      }
   }

}

function checkin() {
   if (!checkinMode) {
      document.getElementById("checkinBox").style.width = "23%";
      document.getElementById("checkinBox").style.display = "flex";
      document.getElementById("checkin").style.background = "#83e8acff";
      checkinMode = true;
   } else if(checkinMode) {
      document.getElementById("checkin").style.background = "#aaccffff";
      var checkinTime = document.getElementById("checkinBox").value.toUpperCase();
      if (!checkinTime) {
         checkinTime = "2 HOURS 30 MINUTES"
      }
      document.getElementById("checkinBox").style.width = "0px";
      document.getElementById("checkinBox").style.display = "none";

      if (checkedIn) {
         globalHTML = globalHTML.replace(prevCheckin, checkinTime);
      } else {
         var nameAnchor = nthIndex(globalHTML, "RecordLocator Begin -->", 1);
         var tdPos = globalHTML.slice(nameAnchor).indexOf("<td")
         var namePos = 1 + globalHTML.slice(tdPos + nameAnchor).indexOf(">");
         var nameEnd = globalHTML.slice(tdPos + nameAnchor + namePos).indexOf("</td>")
         globalHTML = globalHTML.slice(0, tdPos + nameAnchor + namePos +  nameEnd) + "<br />CHECK-IN " + checkinTime + " PRIOR TO DEPARTURE<br/><br/>ALL TIMES SHOWN ARE LOCAL<BR/>" + globalHTML.slice(tdPos + nameAnchor + namePos +  nameEnd);
         checkedIn = true;
      }
      prevCheckin = checkinTime;
      checkinMode = false;
      document.querySelector("iframe").src = makeFile(globalHTML);
   }
}

function closeTabs(toLeave) {
   var tabs = ["sumTab", "helpTab", "euroTab", "railTab", "hotelTab", "itinTab"];
   tabs.forEach(id => {
      if (toLeave != id && document.getElementById(id) != null && document.getElementById(id) != undefined) {
         document.getElementById(id).style.width = "0";
         document.getElementById(id).style.margin = "0 0";
         document.getElementById(id).style.display = "none";
      }
   });
}

function tabSummary() {
   closeTabs("sumTab")
   convert("sum");
}

function tabItin() {
   closeTabs("itinTab");
   convert("itin");
}

function tabEuro() {
   convert("euro");
   closeTabs("euroTab");
}

function tabRail() {
   closeTabs("railTab")
   convert("rail")
}

function tabHotel() {
   closeTabs("hotelTab")
   var inputValue = document.getElementById("summaryInput").value;

   var lines = inputValue.split('\n');
   var outputValue = "";

   for (var i = 0; i < lines.length; i ++) {
      outputValue += lines[i].trim() + (lines[i].length < 1 ? '\n' : ' ')
   }

   var ta = document.getElementById("summaryInput")
   ta.value = outputValue;
   ta.select();
   ta.setSelectionRange(0, 99999);
   document.execCommand('copy')
   ta.setSelectionRange(0, 0);
}

function tabCopy() {
   if (tabSelected=="sum") {
      var moveText = document.getElementById("summaryInput").value;
      moveText = moveText.replace(/\n/g, "<br/>")
      moveText = moveText.replace(/\s/g, "&nbsp")
      document.querySelector("textarea").value = "";
      document.getElementById("copyFrame").innerHTML = moveText;

      var range = document.createRange();
      range.selectNode(document.getElementById("copyFrame"));
      window.getSelection().removeAllRanges(); // clear current selection
      window.getSelection().addRange(range); // to select text
      document.execCommand("copy");
      window.getSelection().removeAllRanges();

      document.getElementById("copyTab").style.width = '12.5%';
      document.getElementById("copyTab").style.display = 'flex';
      document.getElementById("copyTab").disabled = true;
      document.getElementById("copiedStatus").innerHTML = "COPIED";
      // document.getElementById("copiedStatus").style.fontSize = "1.7rem";
      document.getElementById("copiedStatus").style.opacity = 1;
      document.getElementById("copiedStatus").style.top = "80%";

   } else if (tabSelected=="itin" && !editMode) {
      document.getElementById("copyTab").style.background = "#83e8acff";
      var bodyPos = 6 + globalHTML.indexOf("<body ");
      globalHTML = globalHTML.slice(0, bodyPos) + "contenteditable='true' " + globalHTML.slice(bodyPos);
      document.querySelector("iframe").src = makeFile(globalHTML);
      editMode = true;
   } else if (tabSelected=="itin" && editMode) {
      let newText = document.getElementById("iframeItself").contentWindow.document.body.innerHTML;
      // .documentElement.outerHTML
      globalHTML = newText;
      document.getElementById("copyTab").style.background = "#aaccffff";
      globalHTML = globalHTML.replace("contenteditable='true' ", "");
      document.querySelector("iframe").src = makeFile(globalHTML);
      editMode = false;

   } else if (tabSelected=="refund") {
      localStorage.setItem('refundData', document.getElementById('summaryInput').value)
   }
}

function tabHelp() {
   document.getElementById("message").innerHTML = `
      <h1>SUMMARIES:</h1><br/>
      <strong>Paste the entire summary</strong> from Smartpoint <strong>in this window and click 'SUMMARY' </br>
      Note:</strong> You must copy the summary in it's entirety, or at least from the first ' . ' to the end.<br/>
      <br/><h1>ITINERARIES:</h1><br/>
      1) <strong>Right-click anywhere on the itinerary</strong> in Smartpoint <br/>
      2) Select <strong>'View source'</strong> from the drop-down menu<br/>
      3) <strong>Ctrl+A</strong> : to select all the text that appears<br/>
      4) <strong>Ctrl+V</strong> : to paste into this window<br/>
      5)<strong> Click 'ITIN' at the top of this window</strong><br/>
      6) <strong>Click somewhere on the itinerary</strong> then<strong> Ctrl+A </strong>to select itinerary, <strong>Ctrl+C</strong> to copy, ready to paste into email.<br/><br/>
      To add Check-in time info, <strong>click 'CHECK-IN'</strong>, type in the time you want to display then <strong>click 'CHECK-IN' again</strong>. To edit the Itinerary, <strong>click the 'EDIT' button</strong> - when the button is green, the itinerary is editable.
   `;

   if (!helpLatch) {
      document.getElementById("message").style.opacity = 1;
      document.getElementById("message").style.pointerEvents = "All";
      helpLatch = true;
   } else {
      hideHelp()
   }
}

function tabRebook() {
   document.getElementById("message").innerHTML = `
      <h3>Fare Building:</h3><br/>
      <strong>FBC</strong> - Start a new Fare Build </br>
      <strong>*FB</strong> - Redisplay the Fare Build in its template at any point during the Fare Build </br></br>
      <strong>FBU[field][segments]/[data]</strong> - Add data to a desired field for desired segments 
      <strong>i.e</strong><br/>
      <strong>FBUNVB1-3/13MAR24</strong> - Not valid before 13 March for segments 1 TO 3<br/>
      <strong>FBUBG1.3/1PC</strong> - 1 Piece of baggage for segments 1 AND 3<br/>
      <strong>FBUNVA1.3-5/13MAR24</strong> - Not valid after 13 March for segments 1 AND 3, 4, 5<br/>
      <strong>FBUNVB1/13MAR24+NBA1/13MAR24</strong> - NVB AND NVA 13MAR for segment 1 (use '+' to fill multiple fields)<br/><br/>
      <a href="https://support.travelport.com/webhelp/Formats/Content/Fare/ManualFare.htm">Travelport fare building help page</a><br/></br><br/><br/>
      <h3>Exchanging the ticket:</h3><br/>
      <strong>FBF</strong> - File current manual fare</br>
      <strong>TMU1TC[tour code]</strong> - Add tour code to filed fare</br>
      <strong>ER</strong></br>
      <strong>TKPFEX[ticket number]</strong> - Exchange the ticket</br></br>
      <a href="https://support.travelport.com/webhelp/Formats/Content/DocProd/ExchangeExamplesARC.htm">Travelport ticket exchanging help page</a><br/></br>
   `;

   if (!helpLatch) {
      document.getElementById("message").style.opacity = 1;
      document.getElementById("message").style.pointerEvents = "All";
      helpLatch = true;
   } else {
      hideHelp()
   }
}

function checkRefund() {
   let text = document.getElementById('summaryInput').value;
   if (text.toUpperCase().includes("REFUND")) {
      refunds()
   }
}

function refunds() {
   tabSelected = "sum"
   document.getElementById('itinTab').style.width = "0";
   document.getElementById('sumTab').style.width = "0";
   document.getElementById('helpTab').style.width = "0";
   document.getElementById('itinTab').style.margin = "none";
   document.getElementById('helpTab').style.margin = "none";
   document.getElementById('sumTab').style.margin = "none";

   document.getElementById('copyTab').style.width = '12.5%';
   document.getElementById("copyTab").style.display = 'flex';
   document.getElementById('copyTab').disabled = false;

   if (document.getElementById('summaryInput').value != "") {
      let text = document.getElementById('summaryInput').value;
      var nLines = 1 + (text.match(/\n/g)||[]).length;
      var final = "";
      for (var i = 0; i < nLines; i++) {
         if (i < 1) {
            var lineStart = 0;
         } else {
            var lineStart = getPosition(text, "\n", i);
         };

         // Get Line break positions
         var lineEnd = getPosition(text, "\n", i + 1);
         var thisLine = text.slice(lineStart, lineEnd);

         // BREAK for now until we know how Gal signifies refunds
         if (!thisLine.includes('RE')) {continue};

         let output = thisLine.slice(thisLine.indexOf('RE') + 2).trim();
         let wsPos;
         let gbpPos;
         let letterLatch;
         let spaceLatch;

         for (let i = 0; i < thisLine.length; i++) {

            if (output[i] == " ") {
               spaceLatch = true;
            };

            if (spaceLatch && output[i] != " ") {
               gbpPos = i;
               letterLatch = true;
               spaceLatch = false;
            };

            if (letterLatch && output[i] == " ") {
               wsPos = i;
               break;
            }
         };

         output = output.slice(0, gbpPos) + "£" + output.slice(gbpPos, wsPos);
         output = output.slice(0, 3) + "..." + output.slice(9);
         final += output + "\n";

      };

      // let load = localStorage.getItem('refundData');
      // if (load != null) {
      //    final = load + final;
      // }
      // localStorage.setItem('refundData', final);
   };

   // SHOW REFUND LIST
   document.getElementById('summaryInput').value = "";
   document.getElementById('summaryInput').value = final;
   // document.getElementById('summaryInput').value = localStorage.getItem('refundData');

}

function readFile(file) {
    var f = new XMLHttpRequest();
    f.open("GET", file, false);
    f.onreadystatechange = function ()
    {
        if(f.readyState === 4)
        {
            if(f.status === 200 || f.status == 0)
            {
                var res= f.responseText;
                alert(res);
            }
        }
    }
    f.send(null);
}

function instruct() {
   document.getElementById("message").innerHTML = "";
   tabSelected = "helpTab";
   document.querySelector("textarea").style.fontSize = "16pt";
   document.querySelector("textarea").value = "SUMMARIES:\n\n - You must copy the summary from Galileo in it's entirety, or at least from the first '.' to the end.\n - You must have Javascript enabled in your browser";
   updateTab();
}

function zoomMinus() {
   fontSize--;
   document.querySelector("textarea").style.fontSize = fontSize + "pt";
}

function zoomPlus() {
   fontSize++;
   document.querySelector("textarea").style.fontSize = fontSize + "pt";
}

function resetfont() {
   fontSize = 14;
   document.querySelector("textarea").style.fontSize = fontSize + "pt";
}

function hideHelp() {
   document.getElementById("message").style.opacity = 0;
   document.getElementById("message").style.pointerEvents = "None";
   helpLatch = false;
}

document.getElementById('summaryInput').value = "";