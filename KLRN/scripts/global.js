//set global object
var klrn = klrn || {};

//grab and store query parameters from url
(function () {
  if (!location.search) return;
  var queries = location.search.split('?')[1];
  var queryParams = queries.split('&').reduce(function (accum, curr) {
    var param = curr.split('=');
    accum[decodeURIComponent(param[0])] = decodeURIComponent(param[1]);
    return accum;
  }, {});
  klrn.form = queryParams['P']; //this is allegiance page type
  klrn.transaction = queryParams['TranID']; //this is transaction id
  klrn.campaign = queryParams['klrnCampaign']; //this is the klrnCampaign, if any
})();

//remove Google Analytics cross-domain tracking in url, if it exists
(function () {
  const splitter = /\?_gl=|&_gl=|\?_ga=|&_ga=/;
  const href = location.href.split(splitter)[0];
  if (location.href !== href) history.replaceState({}, location.href, href);
})();

//if it exists, remove klrnCampaign in url and create cookie to remember campaign
(function () {
  if (klrn.campaign || klrn.campaign === '') {
    href = location.href.split('&klrnCampaign=')[0];
    history.replaceState({}, location.href, href);
  }

  //if there is a campaign, set cookie to remember for three months
  if (!klrn.campaign) return;
  var date = new Date();
  date.setTime(date.getTime() + 90 * 24 * 60 * 60 * 1000).toString();
  var expires = 'expires=' + date;
  document.cookie =
    'klrnCampaign=' + klrn.campaign + '; ' + expires + '; path=/';
})();

//store page name
klrn.page = (function () {
  var path = window.location.pathname;
  path = path.replace(/\/$/, '').replace(/\.(?:aspx)/, '');
  return path.slice(path.lastIndexOf('/') + 1).toLowerCase();
})();

//store whether page is mobile version
klrn.mobile = (function () {
  var bodyElem = document.getElementsByTagName('body')[0];
  if (bodyElem) return bodyElem.className.indexOf('mobile') !== -1;
  else return false;
})();

//console.log(klrn.page);
//console.log(klrn.mobile);
//console.log(klrn.form);
//console.log(klrn.transaction);

//create form type categories
klrn.formType = (function () {
  if (!klrn.form) return 'not set';

  //map form names to type categories, key = form, value = type
  //the values show up as class names on the body tag, and as Product names in Google eCommerce
  //those using default styles include renewal and prospect
  var types = {
    WEBPASS: 'passport',
    WEBPASC: 'passport',
    PLGGEN: 'onetime',
    PLGGENS: 'onetime',
    PLGGENT: 'onetime',
    WEBGNR: 'onetime',
    PROSPGNR: 'prospect',
    PROSPGNRS: 'prospect',
    RENGNRD: 'renewal',
    RENGNRE: 'renewal',
    RENGNRES: 'renewal',
    RENGNRM: 'renewal',
    ADDGNR: 'add-gift',
    LAPSEGNR: 'lapsed',
    PLGSUS: 'sustainer',
    PLGSUST: 'sustainer',
    WEBSUS: 'sustainer',
    PROSPSUS: 'prospect',
    PROSPSUSS: 'prospect',
    RENSUSD: 'renewal',
    RENSUSE: 'renewal',
    RENSUSES: 'renewal',
    RENSUSM: 'renewal',
    ADDSUS: 'add-gift',
    LAPSESUS: 'lapsed',
    CHEF: 'chef',
    ANTIQUES: 'antiques',
    GIVINGTUE: 'giving-tuesday',
  };

  if (types.length < 1) return;

  var form = klrn.form.toUpperCase();
  if (form in types) return types[form];
  else return 'not set';
})();

//helpers to get data
(function (exports) {
  //retrieve cookie by name
  exports.getCookie = function (name) {
    const cookies = document.cookie.split(';');
    const cookie = cookies.find((val) => val.trim().startsWith(`${name}=`));
    return cookie ? cookie.split('=')[1] : '';
  };

  //grab price from dom
  exports.getPrice = function () {
    let elems = document.querySelectorAll('.IN_CLEAR div');
    let i, amount;
    for (i = 0; i < elems.length; i++) {
      elem = elems[i].innerHTML;
      if (elem && elem.indexOf('Pledge Amount:') !== -1) {
        amount = elems[i + 1].innerHTML.trim();
        amount = parseFloat(amount);
        return amount ? amount : 0;
      }
    }
    console.log('### PRICE NOT SET ###');
    return 'Not set';
  };

  //get number of premiums selected
  exports.getNumberPremiums = function () {
    return Array.from(document.querySelectorAll('em')).filter(
      (el) => el.textContent === 'Qty:'
    ).length;
  };

  //get payment method
  exports.getPaymentMethod = function () {
    let data = document.querySelector('#ctl00_AllegMain_paymentMethod');
    if (data) data = data.textContent;
    if (data) data = data.toLowerCase();
    if (data) {
      data = ['card', 'checking', 'invoice', 'eft'].filter((payment) =>
        data.includes(payment)
      );
    }
    return data && data.length > 0 ? data[0] : 'Not set';
  };
})(klrn);

//check to see if this is an outside campaign to be tracked, and if so reset affiliation
//add check for STRING 'undefined' to filter this showing up in data
klrn.affiliation = 'Not set';
if (klrn.campaign && klrn.campaign !== 'undefined') {
  klrn.affiliation = klrn.campaign;
} else {
  let checkCampaign = klrn.getCookie('klrnCampaign');
  if (checkCampaign && checkCampaign !== 'undefined') {
    klrn.affiliation = checkCampaign.replace(/%2C/g, ','); //decode urlencoded commas
  }
}

//set up other global product values for checkout and purchase tracking
klrn.id = klrn.transaction ? klrn.transaction : 'Not set';
klrn.productName = klrn.formType
  ? klrn.formType[0].toUpperCase() + klrn.formType.slice(1)
  : 'Not set'; //cap first letter
klrn.productCategory = klrn.form ? klrn.form.toUpperCase() : 'Not set';

//ga4: select_item tracking using gTag API for Google Tag Manager datalayer
(function () {
  if (klrn.page !== 'donate') return; //run only if form entry

  //console.log('select_item');
  //console.log(klrn.id);
  //console.log(klrn.productName);
  //console.log(klrn.affiliation);
  //console.log(klrn.productCategory);

  //ga4: now push select_item data into Google Tag Manager's datalayer using gTag API
  gtag('event', 'select_item', {
    items: [
      {
        item_name: klrn.productName,
        affiliation: klrn.affiliation,
        item_category: klrn.productCategory,
        quantity: 1,
      },
    ],
  });
})();

//ga4: begin_checkout tracking using gTag API for Google Tag Manager datalayer
(function () {
  if (klrn.page !== 'datavalidation') return; //run only if validation page
  const price = klrn.getPrice();

  //console.log('begin_checkout');
  //console.log(klrn.id);
  //console.log(klrn.productName);
  //console.log(klrn.affiliation);
  //console.log(klrn.productCategory);
  //console.log(price);

  //ga4: now push begin_checkout data into Google Tag Manager's datalayer using gTag API
  gtag('event', 'begin_checkout', {
    value: price,
    currency: 'USD',
    items: [
      {
        item_id: klrn.id,
        item_name: klrn.productName,
        affiliation: klrn.affiliation,
        item_category: klrn.productCategory,
        price: price,
        quantity: 1,
        item_category2: `${klrn.getPaymentMethod()} payment`,
        item_category3: `${klrn.getNumberPremiums()} premiums`,
      },
    ],
  });
})();

//purchase tracking, using Google Tag Manager dataLayer for ecommerce, Facebook Pixel, and Google AdWords
(function () {
  if (klrn.page !== 'confirmation') return; //run only if confirmation page
  const price = klrn.getPrice();

  //make sure to ignore if this transaction has already been recorded
  if (klrn.transaction && klrn.transaction === klrn.getCookie('transaction')) {
    return;
  }

  //console.log('Requirements met for purchase');
  //console.log(klrn.id);
  //console.log(klrn.productName);
  //console.log(klrn.affiliation);
  //console.log(klrn.productCategory);
  //console.log(price);

  //ga4: now push purchase data into Google Tag Manager's datalayer using gTag API
  gtag('event', 'purchase', {
    transaction_id: klrn.id,
    value: price,
    currency: 'USD',
    items: [
      {
        item_id: klrn.id,
        item_name: klrn.productName,
        affiliation: klrn.affiliation,
        item_category: klrn.productCategory,
        price: price,
        quantity: 1,
        item_category2: `${klrn.getPaymentMethod()} payment`,
        item_category3: `${klrn.getNumberPremiums()} premiums`,
      },
    ],
  });

  //now push data to Facebook Pixel
  let tries = 0;
  fbqTrack();

  function fbqTrack() {
    if (typeof fbq !== 'undefined') fbqPush();
    else if (tries < 30) {
      tries += 1;
      setTimeout(fbqTrack, 100);
    }
  }

  function fbqPush() {
    fbq('track', 'Purchase', {
      value: price,
      currency: 'USD',
      content_ids: klrn.id,
      content_name: klrn.productName,
      content_category: klrn.productCategory,
      num_items: 1,
    });
  }

  //if there is a transaction id, set cookie to remember for a year
  if (klrn.id === 'Not set') return;
  var date = new Date();
  date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000).toString();
  var expires = 'expires=' + date;
  document.cookie = 'transaction=' + klrn.id + '; ' + expires + '; path=/';
})();

//edit address label
(function () {
  var elem = document.getElementById('ctl00_AllegMain_wrkAddr');
  var label, parent1, parent2, parent3;
  if (elem) parent1 = elem.parentNode;
  if (parent1) parent2 = parent1.parentNode;
  if (parent2) parent3 = parent2.parentNode;
  if (parent3) label = parent3.getElementsByTagName('span')[0];
  if (label) label.innerHTML = 'Address (include unit number if applicable)';
})();
