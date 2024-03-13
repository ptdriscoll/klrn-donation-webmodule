//set intro paragraph messages based on forms
(function () {
  if (klrn.page !== 'donate') return;

  //map form names (DEFAULT refers to all not named) to indexes of messages in following array
  var forms = {
    'DEFAULT': 0,
    'WEBPASS': 1,
    'WEBPASC': 1,
    'FUNDPA': 2
  };
  var messages = [
    'By becoming a KLRN Member, your support benefits quality programming from PBS and KLRN. If you were looking for instant Passport access (as a first-time Passport member) to past episodes of your favorite programs, go here:</p><p class="intro_paragraph" style="display: block;"><a class="button" href="https://klrn.secureallegiance.com/klrn/WebModule/Donate.aspx?P=WEBPASC&PAGETYPE=PLG&CHECK=W%2fdAvpGzKAPMF%2bNfCiuek%2bzWDeZ%2beA1M">Go to Passport</a></p>',

    'Gain instant access to Passport programs with an annual donation of $60 or more, or uninterrupted support of $5 or more a month - payable by credit card only. For other contribution options, <a href="https://klrn.secureallegiance.com/klrn/WebModule/Donate.aspx?P=WEBGNR&PAGETYPE=PLG&CHECK=Rn6OGo7h0%2fJEIkmdxt0MhRiCxtaFReuS">go here.</a><br><br>Note that if you were a previous KLRN Passport member and your account has expired, please allow up until the next business day for your membership to be reactivated.',

    'Your support benefits KLRN\'s News & Public Affairs Fund and helps bring back news that matters.'
  ];

  var target = document.querySelector('#info .intro_paragraph');
  if (!target) return; 

  var form = klrn.form.toUpperCase();
  var targetMessageIndex = form in forms ? forms[form] : forms['DEFAULT'];
  var targetMessage = messages[targetMessageIndex];
  target.innerHTML = targetMessage;
  target.style.display = 'block';
}());

//add klrn.formType as class name to body
(function() { 
  if (klrn.page !== 'donate') return;

  var body = document.getElementsByTagName('body')[0];
  if (body) {
    body.className += ' ' + klrn.formType;
  } 
}());

//toggle pay installment buttons to reset, disable on onetime forms when tickets selected
//works on radio button inputs that have 'monthly' in label
(function () {  
  //set text snippets to check if cart includes any ticket items
  var checkText = [
    'TICKET',
    'KLRN APPRAISAL EVENT'
  ];
  
  if (klrn.formType !== 'onetime' || klrn.page !== 'donate') return;
  if (checkText.length < 1) return;

  var select = document.getElementById('ctl00_AllegMain_PREMIUMDROPDOWN'),
      cart = document.getElementById('PremiumCart');
  if (!select || !cart) return;
  
  var modeTable = document.getElementById('ctl00_AllegMain_MODETABLE');
  var radioButtons;
  if (modeTable) radioButtons = modeTable.getElementsByTagName('input');
  if (!radioButtons || radioButtons.length < 1) return;

  var callback = function () {
    var i, checks = checkText.length, textFound = false;
    var j, buttons = radioButtons.length; 
        
    for (i=0; i<checks; i++) {
      if (cart.innerHTML.toUpperCase().indexOf(checkText[i]) !== -1) {
        textFound = true; 
        break;
      }
    }
    
    if (textFound) {
      for (j=0; j<buttons; j++) {
        if (radioButtons[j] && 
            radioButtons[j].nextSibling.innerHTML.toLowerCase().indexOf('monthly') > -1) {
          radioButtons[j].checked = false;
          radioButtons[j].disabled = true;
        }
      }
    }  
    
    else {
      for (j=0; j<buttons; j++) {
        if (radioButtons[j] && 
            radioButtons[j].nextSibling.innerHTML.toLowerCase().indexOf('monthly') > -1) {
          radioButtons[j].disabled = false;
        }          
      }
    }
  }

  if (cart.addEventListener) {
    select.addEventListener('click', callback);
    cart.addEventListener('click', callback);
  }
  else if (cart.attachEvent) {
    select.attachEvent('onclick', callback);
    cart.attachEvent('onclick', callback);
  }

  callback();
}());

