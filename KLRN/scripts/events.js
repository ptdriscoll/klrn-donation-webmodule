var klrn = klrn || {};

//library method to set local time on any machine
klrn.setTime = function(string, asString) {
  var nowTime;
  (string) ? nowTime = new Date(string) : nowTime = new Date();    
  nowTime.setUTCMinutes(nowTime.getUTCMinutes() - nowTime.getTimezoneOffset());
  if (asString) {
    return nowTime = nowTime.toUTCString();
  }
  return nowTime; //as minutes
};

//library method to set schedule blocks
klrn.setSchedule = function (startsArray, endsArray, allDates, doThis) {
  var startsArray = (startsArray instanceof Array) ? startsArray : [startsArray];
  var endsArray = (endsArray instanceof Array) ? endsArray : [endsArray];
  var nowTime = klrn.setTime(),
  startTime = [],
  endTime = [],
  inSchedule = false,
  scheduleIndex = allDates ? [] : -1;
  scheduleIndices = 0;
  for (var i = 0; i < startsArray.length; i++) {
    startTime[i] = klrn.setTime(startsArray[i]);
    if (endsArray[i]) {
      endTime[i] = klrn.setTime(endsArray[i])
    }
    if ((!endsArray[i] && startTime[i] <= nowTime) || (startTime[i] <= nowTime && endTime[i] >= nowTime)) {
      inSchedule = true;
      if (allDates) {
        scheduleIndex[scheduleIndices++] = i;
      }
      else {
        scheduleIndex = i;
        break;
      }
    }
  }
  if (doThis) {
    doThis();
  }
  return {
    inSchedule: inSchedule,
    scheduleIndex: scheduleIndex
  };
};

//callback to set schedule blocks for chef page's tickets at door, and event is over
klrn.chefScheduler = function(premiums) {	
  if (location.search.indexOf('P=CHEF') === -1) return;
  
  console.log('SCHEDULER IS ON');
  //console.log(klrn);

  var dinnerDoor = klrn.setSchedule('March 3, 2019 15:00:00', 'March 3, 2019 18:00:00');
  var dinnerAfter = klrn.setSchedule('March 3, 2019 18:00:01', 'March 4, 2019 10:00:00');
  var lunchDoor = klrn.setSchedule('March 4, 2019 10:00:01', 'March 4, 2019 11:00:00');
  var lunchAfter = klrn.setSchedule('March 4, 2019 11:00:01');

  var parentElem = document.querySelector('#ctl00_AllegMain_PREMIUMLIST');

  var atDoorMessage = function(msg) {
    var elem = document.createElement('p');
    elem.innerHTML = msg;
    elem.style.marginTop = '1.5em';
    parentElem.insertBefore(elem, parentElem.childNodes[0]);   
  }

  if (dinnerDoor.inSchedule) {  
    atDoorMessage('Dinner with Lidia tickets are available at the door');
    if (premiums) {
      premiums.lastChild.style.display = 'none';
    }
  }

  else if (dinnerAfter.inSchedule) {
    if (premiums) {
      premiums.lastChild.style.display = 'none';
    }    
  }

  else if (lunchDoor.inSchedule) {
    atDoorMessage('Lunch with Lidia tickets are available at the door');
    if (premiums) {
      premiums.style.display = 'none';
    }    
  }

  else if (lunchAfter.inSchedule) {
    atDoorMessage('Tickets are no longer available. Thank you.');
    if (premiums) {
      premiums.style.display = 'none';
    }    
  }
};

//callback to remove cents from mobile prices
//and add any edits to ticket descriptions for specific forms
klrn.ticketDescriptions = function(descriptions) {	
  //add ticket descriptions, using klrn.form value to title each container
	var data = {
	  'ROSMRYWB': {
	    'default':
				['1 ticket to Tribute to Rosemary',
					'Silver table w/10 tickets',
					'Gold table w/10 tickets',
					'Platinum table w/10 tickets'],
	    'mobile':
				['1 ticket to Rosemary',
					'Silver table for 10',
					'Gold table for 10',
					'Platinum table for 10']
	  }, 
	  'CHEF': {
	    'mobile':
				['Lunch with Lidia',
                'Dinner with Lidia']
	  }, 
	  'BBQ': {
	    'mobile':
				['Boots, Beer & BBQ',
				'BBQ ticket w/shuttle']
	  } 
	};

  var i, length = descriptions.length, description, price, text;
  for (i=0; i<length; i++) {					
    if (klrn.mobile) {
      price = descriptions[i].getElementsByTagName('td')[1];
      if (price) {
        text = (price.textContent || price.innerText).replace('.00 -', '');
        price.innerHTML = text;
      }								
    }
    if (typeof data[klrn.form] === 'undefined') break;
    description = descriptions[i].getElementsByTagName('td')[2];
    if (description) {
      if (klrn.mobile && data[klrn.form]['mobile']) text = data[klrn.form]['mobile'][i];
      if (!klrn.mobile && data[klrn.form]['default']) text = data[klrn.form]['default'][i];
      if (typeof text === 'undefined') continue;
      description.innerHTML = text;
    }
  }
};

//make sure #premTBODY and its ALLEGELEMNTS are loaded, then make callbacks
(function() {	
	//only run on entry donate page
	if (klrn.page !== 'donate') return;

	var premBody, descriptions, attempts = 0;		
	var checkOnload = function() {
		premBody = document.getElementById('premTBODY');
		if (premBody) descriptions = premBody.querySelector('tr');
		if (!descriptions || !descriptions[0] 
        || !descriptions[0].classList.contains('ALLEGELEMENTS') 
        && attempts < 40) {
			//try again in a bit	
			attempts += 1;
			setTimeout(checkOnload, 50);
		}
		else if (descriptions && descriptions.length > 0) {	
    
      //run callbacks
      klrn.ticketDescriptions(descriptions);
      klrn.chefScheduler(premBody);
      
		}
	};
	checkOnload();
}());



//auto fill specify amount field for onclicks on Add button parents and #PremiumCart 
(function () {

  //DISABLE
  //return;

	//only run on entry donate page
	if (klrn.page !== 'donate') return;
	
	var addButton, attempts = 0;
	var checkOnload = function () {
		addButton = document.getElementsByName("item1");
		if ((!addButton || addButton.length < 1) && attempts < 50) {
			//try again in a bit
			attempts += 1;
			setTimeout(checkOnload, 50);
		}
		else {
			var specifyAmount = document.getElementById('ctl00_AllegMain_ALLEGOTHERAMT'),
					cart = document.getElementById('PremiumCart'),
					i, length = addButton.length;
			if (!specifyAmount) return;
			var handler = function () {
				var premTotalElem = document.getElementsByClassName('PREMTOTAL')[1], premTotal;
				if (premTotalElem) {
					premTotal = (premTotalElem.textContent || premtotalElem.innerText).replace(/\s+/g, '');
				}
				if (premTotal && premTotal.length > 0) {
				  if (premTotal[0] === '$') premTotal = premTotal.slice(1);
					specifyAmount.value = premTotal;
					specifyAmount.focus();
					specifyAmount.blur();
				}
			}
            for (i = 0; i < length; i++) {
                addButton[i].parentNode.addEventListener('click', handler);
            }
            if (cart) cart.addEventListener('click', handler);
		}
	};
	checkOnload();
}());

//amend Ticket Required error message to advise user to click Add button
(function () {
	//only run on entry donate page
	if (klrn.page !== 'donate') return;
	
	var submitButton = document.getElementById('ctl00_AllegMain_btnSubmit'),
			errors = document.getElementById('ctl00_AllegMain_DonationSummary'),
			errorMessages;   

    var handler = function () { 
        if (errorMessages) {
            for (i = 0; i < errorMessages.length; i++) {
                if ((errorMessages[i].textContent || errorMessages[i].innerText).indexOf('Ticket Required') > -1) {
                    errorMessages[i].innerHTML = 'Ticket or Item Required (be sure to click "Add" button)';
                    break;
                }
            }
        }
    }

    if (errors) errorMessages = errors.getElementsByTagName('li');
    if (submitButton) submitButton.addEventListener('click', handler);

}());