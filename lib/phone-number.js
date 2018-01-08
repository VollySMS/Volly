'use strict';

let areaCodeMap = {'201': true, '202': true, '203': true, '204': true, '205': true, '206': true, '207': true, '208': true, '209': true, '210': true, '212': true, '213': true, '214': true, '215': true, '216': true, '217': true, '218': true, '219': true, '224': true, '225': true, '228': true, '229': true, '231': true, '234': true, '239': true, '240': true, '242': true, '246': true, '248': true, '250': true, '251': true, '252': true, '253': true, '254': true, '256': true, '260': true, '262': true, '264': true, '267': true, '268': true, '269': true, '270': true, '276': true, '281': true, '284': true, '289': true, '301': true, '302': true, '303': true, '304': true, '305': true, '306': true, '307': true, '308': true, '309': true, '310': true, '312': true, '313': true, '314': true, '315': true, '316': true, '317': true, '318': true, '319': true, '320': true, '321': true, '323': true, '325': true, '330': true, '334': true, '336': true, '337': true, '339': true, '340': true, '345': true, '347': true, '351': true, '352': true, '360': true, '361': true, '386': true, '401': true, '402': true, '403': true, '404': true, '405': true, '406': true, '407': true, '408': true, '409': true, '410': true, '412': true, '413': true, '414': true, '415': true, '416': true, '417': true, '418': true, '419': true, '423': true, '425': true, '430': true, '432': true, '434': true, '435': true, '440': true, '441': true, '443': true, '450': true, '456': true, '469': true, '473': true, '478': true, '479': true, '480': true, '484': true, '501': true, '502': true, '503': true, '504': true, '505': true, '506': true, '507': true, '508': true, '509': true, '510': true, '512': true, '513': true, '514': true, '515': true, '516': true, '517': true, '518': true, '519': true, '520': true, '530': true, '540': true, '541': true, '551': true, '559': true, '561': true, '562': true, '563': true, '567': true, '570': true, '571': true, '573': true, '574': true, '580': true, '585': true, '586': true, '601': true, '602': true, '603': true, '604': true, '605': true, '606': true, '607': true, '608': true, '609': true, '610': true, '612': true, '613': true, '614': true, '615': true, '616': true, '617': true, '618': true, '619': true, '620': true, '623': true, '626': true, '630': true, '631': true, '636': true, '641': true, '646': true, '647': true, '649': true, '650': true, '651': true, '660': true, '661': true, '662': true, '664': true, '670': true, '671': true, '678': true, '682': true, '701': true, '702': true, '703': true, '704': true, '705': true, '706': true, '707': true, '708': true, '709': true, '710': true, '712': true, '713': true, '714': true, '715': true, '716': true, '717': true, '718': true, '719': true, '720': true, '724': true, '727': true, '731': true, '732': true, '734': true, '740': true, '754': true, '757': true, '758': true, '760': true, '763': true, '765': true, '767': true, '770': true, '772': true, '773': true, '774': true, '775': true, '778': true, '780': true, '781': true, '784': true, '785': true, '786': true, '787': true, '801': true, '802': true, '803': true, '804': true, '805': true, '806': true, '807': true, '808': true, '809': true, '810': true, '812': true, '813': true, '814': true, '815': true, '816': true, '817': true, '818': true, '819': true, '828': true, '830': true, '831': true, '832': true, '843': true, '845': true, '847': true, '848': true, '850': true, '856': true, '857': true, '858': true, '859': true, '860': true, '862': true, '863': true, '864': true, '865': true, '867': true, '868': true, '869': true, '870': true, '876': true, '878': true, '880': true, '881': true, '882': true, '901': true, '902': true, '903': true, '904': true, '905': true, '906': true, '907': true, '908': true, '909': true, '910': true, '912': true, '913': true, '914': true, '915': true, '916': true, '917': true, '918': true, '919': true, '920': true, '925': true, '928': true, '931': true, '936': true, '937': true, '939': true, '940': true, '941': true, '947': true, '949': true, '952': true, '954': true, '956': true, '970': true, '971': true, '972': true, '973': true, '978': true, '979': true, '980': true, '985': true, '989': true };

const phoneNumber = module.exports = {};

let _formatPhoneNumber = rawPhoneNumber => {
  let formattedPhoneNumber = rawPhoneNumber.replace(/\D/g, '');
  
  if(formattedPhoneNumber.length === 11 && formattedPhoneNumber[0] === '1')
    return '+' + formattedPhoneNumber;
  else if (formattedPhoneNumber.length === 10)
    return '+1' + formattedPhoneNumber;
  else
    return null;
};

let _verifyAreaCode = formattedPhoneNumber => {
  if(areaCodeMap[formattedPhoneNumber.slice(2,5)])
    return formattedPhoneNumber;
  return null;
};

phoneNumber.verifyPhoneNumber = rawPhoneNumber => {
  let formattedPhoneNumber = _formatPhoneNumber(rawPhoneNumber);
  if(!formattedPhoneNumber)
    return null;

  return _verifyAreaCode(formattedPhoneNumber);
};

