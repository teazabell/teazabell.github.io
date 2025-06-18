const countType = null;
var toteMap = new Map()
window.onload = function () {
  toggleInputBox();
  togglePackingOption();
};

document.addEventListener('DOMContentLoaded', function () {
  const packingOption = document.getElementById('packingOption');
  if (packingOption) {
    packingOption.value = 'RANDOM_TOTE';
  }
});

function togglePackingOption() {
  var packingOption = document.getElementById('packingOption');
  var divOneTote = document.getElementById('one-tote-info');
  var divRandomTote = document.getElementById('random-tote-info');
  var divSparateTote = document.getElementById('separate-tote-info');
  if (packingOption === null || divOneTote === null || divSparateTote === null) return

  var selectedValue = packingOption.value;
  if (selectedValue === 'ONE_TOTE') {
    divOneTote.style.display = 'block';
    divSparateTote.style.display = 'none';
    divRandomTote.style.display = 'none';
  } else if (selectedValue === 'SEPARATE_TOTE') {
    divSparateTote.style.display = 'block';
    divOneTote.style.display = 'none';
    divRandomTote.style.display = 'none';
  } else {
    divRandomTote.style.display = 'block';
    divSparateTote.style.display = 'none';
    divOneTote.style.display = 'none';
  }
}

function processPrepareDispatchOrder() {
  try {
    const deliveryOrder = document.getElementById('inputDoDispatchOrder').value;

    let jsonObject = JSON.parse(deliveryOrder);

    const confirmToteObj = confirmTote(jsonObject);
    const confirmShipmentObj = confirmShipment(jsonObject);

    const confirmToteJson = JSON.stringify(confirmToteObj, null, 2);
    const confirmShipmentJson = JSON.stringify(confirmShipmentObj, null, 2);

    document.getElementById('confirmToteOutput').textContent = confirmToteJson;
    document.getElementById('confirmShipmentOutput').textContent = confirmShipmentJson;

    renderToteTable(toteMap)
  } catch (error) {
    document.getElementById('confirmToteOutput').textContent = 'Invalid JSON';
    document.getElementById('confirmShipmentOutput').textContent = 'Invalid JSON';
  }
}

function generateToteIdList(itemCount) {
  const prefixToteList = [
    "PL",
    "TG", "TXG", "TTG", "TSG", "TMG", "TLG", "TDG",
    "TXP", "TTP", "TSP", "TMP", "TLP", "TDP",
    "TXR", "TTR", "TSR", "TMR", "TLR", "TDR",
    "TS", "TXS", "TTS", "TSS", "TMS", "TLS", "TDS",
    "TXB", "TTB", "TSB", "TMB", "TLB", "TDB",
    "TXT", "TTT", "TST", "TMT", "TLT", "TDT",
    "TXY", "TTY", "TSY", "TSYE", "TMY", "TLY", "TDY",
    "BXG", "BTG", "BSG", "BMG", "BLG", "BDG",
    "BXP", "BTP", "BSP", "BMP", "BLP", "BDP",
    "BXR", "BTR", "BSR", "BMR", "BLR", "BDR",
    "BXS", "BTS", "BSS", "BMS", "BLS", "BDS",
    "BXB", "BTB", "BSB", "BMB", "BLB", "BDB",
    "BXT", "BTT", "BST", "BMT", "BLT", "BDT",
    "BXY", "BTY", "BSY", "BMY", "BLY", "BDY",
    "TX",
    "TDO"
  ];

  const inputPrefixTote = document.getElementById('prefixTote').value;
  const prefixTotes = inputPrefixTote.split(',').map((prefix) => prefix.trim());

  const toteCode = document.getElementById('toteCode').value;
  const runningStart = +document.getElementById('startRunningNumber').value;
  const randomToteCode = document.getElementById('randomToteCode').value;
  const runningRandomStart = +document.getElementById('startRandomRunningNumber').value;
  const packingOption = document.getElementById('packingOption').value;
  const toteId = document.getElementById('toteId').value;

  const toteIdList = [];

  for (let i = 0; i < itemCount; i++) {
    let generated;

    if (packingOption === 'ONE_TOTE') {
      generated = toteId;

    } else if (packingOption === 'SEPARATE_TOTE') {
      const prefix = prefixTotes.length === 1 ? prefixTotes[0] : prefixTotes[i] || prefixTotes[0];
      generated = `${prefix}${toteCode}${String(runningStart + i).padStart(4, '0')}`;

    } else {
      const randomIndex = Math.floor(Math.random() * prefixToteList.length);
      generated = `${prefixToteList[randomIndex]}${randomToteCode}${String(runningRandomStart + i).padStart(4, '0')}`;
    }
    toteIdList.push(generated);
  }

  return toteIdList;
}

function confirmTote(deliveryOrder) {
  const details = [];
  const itemCount = deliveryOrder.items.length;
  const toteIdList = generateToteIdList(itemCount)

  toteMap = new Map()
  for (let i = 0; i < itemCount; i++) {
    const doItem = deliveryOrder.items[i];

    const barcode = doItem.barcode;
    const toteId = toteIdList[i]

    // Update toteMap
    if (!toteMap.has(toteId)) {
      toteMap.set(toteId, []);
    }
    toteMap.get(toteId).push(barcode);

    details.push({
      "referenceNo": deliveryOrder.doNo,
      "sku": doItem.articleNo,
      "toteId": toteIdList[i],
      "qtyOrdered": doItem.qty * doItem.unitFactor
    });
  }

  const orderinfo = {
    "xmldata": {
      "data": {
        "orderinfo": [
          {
            "_comment": "this file has to change 'warehouseId, orderType, docNo, soReferenceA, soReferenceB, referenceNo, sku. toteId'",
            "warehouseId": "TDNE-01",
            "orderType": deliveryOrder.po.orderType,
            "customerId": "TD001",
            "docNo": deliveryOrder.doNo,
            "soReferenceA": deliveryOrder.po.poNo,
            "soReferenceB": deliveryOrder.shipment.shipmentNo,
            "details": details
          }
        ]
      }
    }
  };

  return orderinfo;
}

function confirmShipment(deliveryOrder) {
  const details = [];
  const plateNo = document.getElementById('platNo').value;
  const driverName = document.getElementById('driverName').value;
  const now = new Date();

  for (let i = 0; i < deliveryOrder.items.length; i++) {
    const doItem = deliveryOrder.items[i];
    details.push({
      "referenceNo": deliveryOrder.doNo,
      "lineNo": i + 1,
      "sku": doItem.articleNo,
      "qtyShipped": doItem.qty * doItem.unitFactor,
      "lotAtt01": "",
      "lotAtt02": "",
      "lotAtt03": generateDate(now),
      "lotAtt05": "CJ",
      "lotAtt06": "CJ",
      "lotAtt08": "N"
    });
  }

  const orderinfo = {
    "xmldata": {
      "data": {
        "orderinfo": [
          {
            "warehouseId": "TDNE-01",
            "orderType": deliveryOrder.po.orderType,
            "customerId": "TD001",
            "docNo": deliveryOrder.doNo,
            "soReferenceA": deliveryOrder.po.poNo,
            "soReferenceB": deliveryOrder.shipment.shipmentNo,
            "deliveryNo": deliveryOrder.doNo,
            "carrierId": "210000263",
            "shippedTime": generateDateTime(now),
            "userDefine1": plateNo,
            "userDefine2": driverName,
            "details": details
          }
        ]
      }
    }
  };

  return orderinfo;
}

function generateDateTime(date) {
  const now = date ? new Date(date) : new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function generateDateTimeTDSC(date) {
  const now = date ? new Date(date) : new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.0`;
}

function generateDate(date) {
  const now = date ? new Date(date) : new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function generateCompactDateTime(date) {
  const now = date ? new Date(date) : new Date();
  const pad = (n, len = 2) => String(n).padStart(len, '0');

  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function formatTimeHHmmssSSS(date = new Date()) {
  const pad = (num, size) => num.toString().padStart(size, "0");

  const hours = pad(date.getHours(), 2);
  const minutes = pad(date.getMinutes(), 2);
  const seconds = pad(date.getSeconds(), 2);
  const millis = pad(date.getMilliseconds(), 3);

  return `${hours}${minutes}${seconds}${millis}`;
}

function clearDataDispatchOrder() {
  document.getElementById('inputDoDispatchOrder').value = '';
  document.getElementById('platNo').value = '';
  document.getElementById('driverName').value = '';
  document.getElementById('confirmToteOutput').textContent = '';
  document.getElementById('confirmShipmentOutput').textContent = '';
  const packingOption = document.getElementById('packingOption');
  if (packingOption) {
    packingOption.value = 'RANDOM_TOTE';
    togglePackingOption();
  }
}

function copyToClipboard(elementId, copyId) {
  const outputElement = document.getElementById(elementId);
  const range = document.createRange();
  range.selectNode(outputElement);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  document.execCommand('copy');
  window.getSelection().removeAllRanges();

  const copyButton = document.getElementById(copyId);
  copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
  copyButton.disabled = true;

  setTimeout(() => {
    copyButton.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
    copyButton.disabled = false;
  }, 2000);
}

function showCenterToast(message, duration = 2000) {
  const toast = document.getElementById('centerToast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

function processPrepareSubmitGr() {
  try {
    const deliveryOrderRawData = document.getElementById('inputDoSubmitGr').value;
    let driverSignImage = document.getElementById('driverSignImage').value;

    let deliveryOrder = JSON.parse(deliveryOrderRawData);
    console.log(deliveryOrder)

    let i = 1
    let totalAmount = 0
    const allTotes = new Set();
    const items = [];
    for (let i = 0; i < deliveryOrder.items.length; i++) {
      const doItem = deliveryOrder.items[i];
      const receiveQty = +doItem.qty * +doItem.unitFactor;

      const totes = []

      if (doItem.totes && doItem.totes.length > 0) {
        for (let j = 0; j < doItem.totes.length; j++) {
          const tote = doItem.totes[j];
          totes.push({
            "toteId": tote.toteId,
            "qty": receiveQty
          })
          allTotes.add(tote.toteId);
        }
      }

      items.push({
        "itemNo": i++,
        "barcode": doItem.barcode,
        "claimAmount": {
          "amount": 0.0,
          "currency": "THB"
        },
        "claimQty": 0,
        "receiveAmount": doItem.amount,
        "receiveQty": receiveQty,
        "receiveQtyOnDO": receiveQty,
        "totes": totes
      })
      totalAmount += doItem.amount["amount"]
    }

    let prepareSumbit = {
      "allTotes": Array.from(allTotes),
      "amount": {
        "amount": totalAmount.toFixed(2),
        "currency": "THB"
      },
      "claimAmount": {
        "amount": 0.0,
        "currency": "THB"
      },
      "doNo": deliveryOrder.doNo,
      "driverSignImage": driverSignImage,
      "excessItems": [],
      "items": items,
      "merchantNo": deliveryOrder.po.merchantNo,
      "notReceiveTotes": [],
      "orderType": "SPECIAL_REQUEST",
      "poNumber": deliveryOrder.po.poNo,
      "receiveTotes": Array.from(allTotes),
      "returnItems": [],
      "returnedTotes": Array.from(allTotes),
      "shipmentNo": deliveryOrder.shipmentNo,
      "signImage": driverSignImage,
      "storeNo": deliveryOrder.po.storeNo,
      "toBeReturnedTote": 0,
      "unownedTotes": []
    }

    const submitGrJson = JSON.stringify(prepareSumbit, null, 2);

    document.getElementById('submitGrOutput').textContent = submitGrJson;
  } catch (error) {
    document.getElementById('submitGrOutput').textContent = 'Invalid JSON';
  }
}

function clearDataSubmitGr() {
  document.getElementById('inputDoSubmitGr').value = '';
  document.getElementById('driverSignImage').value = '';
  document.getElementById('submitGrOutput').textContent = '';
}

function processPrepareCreateStockCountRequest() {
  try {
    const selectedInputSeparator = document.querySelector('input[name="inputSeparatorStockCount"]:checked');
    const inputSeparator = selectedInputSeparator ? selectedInputSeparator.value : null;

    const subject = document.getElementById('subject').value;
    const itemType = document.getElementById('itemType').value;

    const inputCodes = document.getElementById('inputCodes').value;
    const items = (inputSeparator === 'NEW_LINE' ? inputCodes.trim().split('\n') : inputCodes.split(',')).map((item) => item.trim());

    const selectStore = document.getElementById('selectStore').value;
    let stores = []
    if (selectStore === "DEAR") {
      stores = ["PANDA01", "PANDA02"]
    }
    else if (selectStore === "TUNG") {
      stores = ["CJX12491", "CJX12492", "CJX7777", "PANDA01", "PANDA02"]
    }
    else if (selectStore === "ANDROID") {
      stores = ["GX000001", "GX999999"]
    }
    else if (selectStore === "DEAR+ANDROID") {
      stores = ["PANDA01", "PANDA02", "GX000001", "GX999999"]
    } else {
      const inputStores = document.getElementById('inputStores').value;
      stores = inputStores.split(",").map((item) => item.trim());
    }

    const startDate = new Date();
    startDate.setMinutes(0, 0, 0);
    startDate.setHours(startDate.getHours() + 1);
    const countStartDatetime = startDate.toISOString();

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    endDate.setHours(23, 59, 59, 999);
    const countEndDatetime = endDate.toISOString()

    const payload = {
      subject: subject,
      countStartDatetime: countStartDatetime,
      countEndDatetime: countEndDatetime,
      itemType: itemType,
      items: items,
      selectStore: "SELECT_BY_STORE",
      storeCodes: stores,
    }

    const payloadJson = JSON.stringify(payload, null, 2);

    document.getElementById('stockCountRequestOutput').textContent = payloadJson;
  } catch (error) {
    document.getElementById('stockCountRequestOutput').textContent = 'Invalid JSON';
  }
}

function clearDataCreateStockCountRequest() {
  document.getElementById('subject').value = '';
  document.getElementById('itemType').value = '';
  document.getElementById('inputCodes').value = '';
  document.getElementById('inputStores').value = '';
  document.getElementById('selectStore').value = '';
  document.getElementById('stockCountRequestOutput').textContent = '';
  document.querySelector('input[name="inputSeparatorStockCount"][value="NEW_LINE"]').checked = true;
}

function toggleInputBox() {
  var selectBox = document.getElementById('selectStore');
  var divInputStores = document.getElementById('divInputStores');
  if (selectBox === null || divInputStores === null) return

  var selectedValue = selectBox.value;
  if (selectedValue === 'OTHER') {
    divInputStores.style.display = 'block';
  } else {
    divInputStores.style.display = 'none';
  }
}

function thaiLocaleCompare(s1, s2, ascending = true) {
  const collator = new Intl.Collator('th-TH');
  // Check if one string starts with English and the other with Thai
  const isS1English = /^[A-Za-z]/.test(s1);
  const isS2English = /^[A-Za-z]/.test(s2);

  // Ensure English words come first, Thai words after
  if (isS1English && !isS2English) return ascending ? -1 : 1;
  if (!isS1English && isS2English) return ascending ? 1 : -1;

  // If both are the same (both English or both Thai), sort by Thai locale
  const comparison = collator.compare(getThaiComparisonString(s1), getThaiComparisonString(s2));
  return ascending ? comparison : -comparison;
}

function getThaiComparisonString(s) {
  return Array.from(s).map(char => {
    return char === ' ' ? '0' : char;
  }).join('');
}

function processingThaiLocalSorting(ascending = true) {
  try {
    // Retrieve input separator selection
    const selectedInputSeparator = document.querySelector('input[name="inputSeparator"]:checked');
    const inputSeparator = selectedInputSeparator ? selectedInputSeparator.value : null;

    // Retrieve output separator selection
    const selectedOutputSeparator = document.querySelector('input[name="outputSeparator"]:checked');
    const outputSeparator = selectedOutputSeparator ? selectedOutputSeparator.value : null;

    // Get input text and split into an array based on the input separator
    const inputText = document.getElementById('inputText').value;
    const thaiStrings = inputSeparator === 'NEW_LINE' ? inputText.split('\n') : inputText.split(',');

    // Sort the array with the specified order
    const sortedThaiStrings = thaiStrings.sort((a, b) => thaiLocaleCompare(a, b, ascending));

    // Join sorted strings based on output separator and display result
    document.getElementById('sortingOutput').textContent = outputSeparator === 'NEW_LINE'
      ? sortedThaiStrings.join('\n')
      : sortedThaiStrings.join(',');
  } catch (error) {
    document.getElementById('sortingOutput').textContent = 'Invalid Text';
  }
}

function clearDataSorting() {
  document.querySelector('input[name="inputSeparator"][value="NEW_LINE"]').checked = true;
  document.querySelector('input[name="outputSeparator"][value="NEW_LINE"]').checked = true;
  document.getElementById('inputText').value = '';
  document.getElementById('sortingOutput').textContent = '';
  document.getElementById('sortStatus').textContent = '';

  isAscending = true
  const sortButton = document.getElementById('sortButton');
  const icon = sortButton.querySelector('i');
  icon.className = 'fas fa-sort-amount-up-alt';
  sortButton.textContent = ' Sort A to Z';
  sortButton.prepend(icon);
}

let isAscending = true;

function toggleSortOrder() {
  const sortButton = document.getElementById('sortButton');
  const icon = sortButton.querySelector('i');

  if (isAscending) {
    processingThaiLocalSorting(true);
    icon.className = 'fas fa-sort-amount-down-alt';
    sortButton.textContent = ' Sort Z to A';
    sortButton.prepend(icon);
    document.getElementById('sortStatus').textContent = 'ASCENDING';
  } else {
    processingThaiLocalSorting(false);
    icon.className = 'fas fa-sort-amount-up-alt';
    sortButton.textContent = ' Sort A to Z';
    sortButton.prepend(icon);
    document.getElementById('sortStatus').textContent = 'DESCENDING';
  }

  isAscending = !isAscending;
}

function processPrepareCreateStockCountGroup() {
  try {
    const docNo = document.getElementById('docNo').value;
    const deviceId = document.getElementById('deviceId').value;
    const groupType = document.getElementById('groupType').value;

    const items = this.countType == 'CLASS' ? generatePayloadTypeClass() : generatePayloadTypeArticle()

    const payload = {
      ...(groupType === 'STORE' && { docNo }),
      stockCountGroupType: groupType,
      stockCountItemType: this.countType,
      items,
      deviceId,
      modeSetting: "GR_INCLUDED"
    }

    const payloadJson = JSON.stringify(payload, null, 2);

    document.getElementById('stockCountGroupOutput').textContent = payloadJson;
  } catch (error) {
    document.getElementById('stockCountGroupOutput').textContent = 'Invalid JSON';
  }
}

function generatePayloadTypeClass() {
  const selectedInputSeparator = document.querySelector('input[name="inputSeparatorGroup"]:checked');
  const inputSeparator = selectedInputSeparator ? selectedInputSeparator.value : null;
  const inputCodes = document.getElementById('inputCodesGroup').value;
  const list = (inputSeparator === 'NEW_LINE' ? inputCodes.split('\n') : inputCodes.split(','))
  return list.map(item => ({
    classCode: item.trim(),
    product: []
  }))
}

function generatePayloadTypeArticle() {
  const rawDatas = document.getElementById('inputArticleJson').value;
  const jsonObject = JSON.parse(rawDatas);
  const groupedMap = {};

  jsonObject.forEach(item => {
    const { classCode, articleNo } = item;
    if (groupedMap[classCode]) {
      groupedMap[classCode].push(articleNo);
    } else {
      groupedMap[classCode] = [articleNo];
    }
  });

  return Object.entries(groupedMap).map(([classCode, products]) => ({
    classCode,
    products
  }));
}

function clearDataCreateStockCountGroup() {
  document.querySelector('input[name="inputSeparatorGroup"][value="NEW_LINE"]').checked = true;
  document.getElementById('deviceId').value = '{{deviceId}}';
  document.getElementById('docNo').value = '';
  document.getElementById('inputCodesGroup').value = '';
  document.getElementById('inputArticleJson').value = '';
  document.getElementById('stockCountGroupOutput').textContent = '';

  resetCollapsible()
}

function openGeneratePayloadCreateStockCount(inputCountType) {
  this.countType = inputCountType;
  var coll = document.getElementsByClassName("collapsible");

  for (let i = 0; i < coll.length; i++) {
    coll[i].onclick = function () {
      // ตรวจสอบว่า collapsible นี้เปิดอยู่หรือไม่
      const isActive = this.classList.contains("active-collapsible");

      // ปิด collapsible อื่นทั้งหมด
      for (let j = 0; j < coll.length; j++) {
        coll[j].classList.remove("active-collapsible");
        coll[j].nextElementSibling.style.display = "none";
      }

      // หาก collapsible ที่คลิกไม่ได้เปิดอยู่ ให้เปิดใหม่
      if (!isActive) {
        this.classList.add("active-collapsible");
        this.nextElementSibling.style.display = "block";
      }
    };
  }
}

function resetCollapsible() {
  var coll = document.getElementsByClassName("collapsible");

  for (let i = 0; i < coll.length; i++) {
    coll[i].classList.remove("active-collapsible");
    coll[i].nextElementSibling.style.display = "none";
  }
}

function processingFormatter(ascending = true) {
  try {
    // Retrieve input separator selection
    const selectedInputSeparator = document.querySelector('input[name="inputSeparatorArrayFormatter"]:checked');
    const inputSeparator = selectedInputSeparator ? selectedInputSeparator.value : null;

    // Retrieve output separator selection
    const selectedOutputSeparator = document.querySelector('input[name="outputSeparatorArrayFormatter"]:checked');
    const outputSeparator = selectedOutputSeparator ? selectedOutputSeparator.value : null;

    const selectedOutputQuote = document.querySelector('input[name="outputQuoteArrayFormatter"]:checked');
    const outputQuote = selectedOutputQuote ? selectedOutputQuote.value : null;

    // Get input text and split into an array based on the input separator
    const inputText = document.getElementById('inputFormatter').value;
    const cleanString = inputText.replace(/["']/g, '');
    const thaiStrings = inputSeparator === 'NEW_LINE' ? cleanString.split('\n').filter(str => str.trim() !== '') : cleanString.split(',');

    // Join strings based on output separator and display result

    let formattedText;
    if (outputSeparator === 'NEW_LINE') {
      formattedText = thaiStrings.map(str => formatQuote(outputQuote, str)).join('\n');
    } else if (outputSeparator === 'COMMA_NEWLINE') {
      formattedText = thaiStrings.map(str => formatQuote(outputQuote, str)).join(',\n');
    } else {
      formattedText = thaiStrings.map(str => formatQuote(outputQuote, str)).join(',');
    }

    document.getElementById('formatterOutput').textContent = formattedText;
  } catch (error) {
    document.getElementById('formatterOutput').textContent = 'Invalid Text';
  }
}

function formatQuote(quoteType, str) {
  if (quoteType === 'DOUBLE_QUOTE') {
    return `"${str}"`
  }
  else if (quoteType === 'SINGLE_QUOTE') {
    return `'${str}'`
  }
  else {
    return str
  }
}

function clearDataFormatter() {
  document.querySelector('input[name="inputSeparatorArrayFormatter"][value="NEW_LINE"]').checked = true;
  document.querySelector('input[name="outputSeparatorArrayFormatter"][value="NEW_LINE"]').checked = true;
  document.querySelector('input[name="outputQuoteArrayFormatter"][value="NO_QUOTE"]').checked = true;
  document.getElementById('inputFormatter').value = '';
  document.getElementById('formatterOutput').textContent = '';
}

function removeDashesAndEmptyLines() {
  let inputText = document.getElementById('inputRemoveSpace').value;

  // ลบข้อความที่ไม่ต้องการ
  inputText = inputText.replace(/หากต้องการแปลภาษาเพิ่มเติม แนะนำให้ใช้ HIX Translate ซึ่งขับเคลื่อนด้วย ChatGPT 3.5\/4 🔥/g, '');
  inputText = inputText.replace(/\(โปรดติดตามตอนต่อไป…\)/g, '');

  // ลบขีด (เช่น --- และ —)
  let result = inputText.replace(/^\s*[-—]+\s*$/gm, '');

  // ลบช่องว่างที่เกินมา (เช่น บรรทัดว่าง)
  result = result.replace(/^\s*[\r\n]/gm, '');

  // แยกข้อความเป็นบรรทัด
  let lines = result.split("\n");

  let formattedText = "";
  let previousWasHeading = false;

  lines.forEach((line, index) => {
    let trimmedLine = line.trim();

    // ตรวจสอบว่าบรรทัดนี้เป็นหัวข้อหรือไม่
    let isHeading =
      trimmedLine.length > 0 && // ไม่ใช่บรรทัดว่าง
      (trimmedLine.length < 30 ||  // บรรทัดสั้น
        /[:\-]$/.test(trimmedLine)); // ลงท้ายด้วย : หรือ -

    if (isHeading) {
      // เว้น 2 บรรทัดก่อนหน้าหัวข้อ
      if (formattedText !== "") {
        formattedText += "\n\n";
      }
      formattedText += trimmedLine;
      previousWasHeading = true;
    } else {
      // ตรวจสอบว่ามีตัวเลขลำดับขึ้นต้นหรือไม่ (1. , 2. , 3.)
      let numberedListMatch = trimmedLine.match(/^(\d+\.)\s+(.*)/);

      if (numberedListMatch) {
        // เว้นบรรทัดก่อนรายการเลขลำดับ
        if (formattedText !== "") {
          formattedText += "\n";
        }
        formattedText += `${numberedListMatch[1]} ${numberedListMatch[2]}`;
      } else {
        // ถ้าไม่ใช่หัวข้อ ให้เยื้องหน้า
        formattedText += (previousWasHeading ? "" : "\n") + "  " + trimmedLine;
      }
      previousWasHeading = false;
    }
  });

  // แทนที่ newline (`\n`) เป็น `<p>` เพื่อให้คัดลอกไป Word ได้สมบูรณ์
  let formattedHtml = formattedText.replace(/\n/g, "<p style='text-indent: 2em; margin: 0;'>");

  // แสดงผลที่หน้าเว็บ
  document.getElementById('outputRemoveSpace').innerHTML = formattedHtml;
}

function clearDataRemoveSpace() {
  document.getElementById('inputRemoveSpace').value = '';
  document.getElementById('outputRemoveSpace').innerHTML = '';
}

function copyToClipboardV2() {
  const outputElement = document.getElementById('outputRemoveSpace');
  const htmlContent = outputElement.innerHTML;

  // ใช้ Clipboard API เพื่อคัดลอกเป็น Rich Text (HTML)
  navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([htmlContent], { type: 'text/html' }) })])
    .then(() => {
      // alert('Copied to clipboard! Now paste into Word.');
    })
    .catch(err => {
      console.error('Error copying to clipboard:', err);
    });
}

function exportDispatchOrderTDSCCSV() {
  const headers = [
    "01", "shipmentNo", "doNo", "barcode", "pickedQty", "uom", "toteId", "deliverydate",
    "pickupdate", "couriercode", "couriername", "drivername", "truckId", "plateno",
    "loadingNo", "priceDate"
  ];

  const inputDeliveryOrder = document.getElementById('inputDoDispatchOrder').value;
  let deliveryOrder = JSON.parse(inputDeliveryOrder);

  const now = new Date()
  const currentDateTime = generateDateTimeTDSC(now)
  const currentDate = generateDate(now)
  const plateNo = document.getElementById('platNo').value;
  const driverName = document.getElementById('driverName').value;
  const itemCount = deliveryOrder.items.length;
  const toteIdList = generateToteIdList(itemCount)
  const priceDate = document.getElementById('priceDate').value;

  const rows = []
  toteMap = new Map()
  for (let i = 0; i < itemCount; i++) {
    const doItem = deliveryOrder.items[i];
    let productName = doItem.productName ?? "";

    if (productName.includes(",")) {
      productName = `"${productName}"`;
    }

    const barcode = doItem.barcode;
    const toteId = toteIdList[i]
    // Update toteMap
    if (!toteMap.has(toteId)) {
      toteMap.set(toteId, []);
    }
    toteMap.get(toteId).push(barcode);

    rows.push([
      "01",
      `SO-${deliveryOrder.doNo}`,
      deliveryOrder.doNo,
      doItem.barcode,
      (doItem.assignedQty).toFixed(2),
      doItem.crossDock.unit, //TODO
      toteId,
      currentDateTime,
      currentDateTime,
      "",
      "",
      driverName,
      `Truck@Galaxy`,
      "",
      `LD${generateCompactDateTime(now)}`,
      priceDate == null || priceDate == '' ? 'YYYY-MM-DD' : priceDate
    ]);
  }

  const csvArray = [headers, ...rows];

  const csvContent = csvArray
    .map(row => {
      while (row.length > 1 && row[row.length - 1] === "") {
        row.pop();
      }
      return row.join("|");
    })
    .join("\n");

  const BOM = "\uFEFF";

  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `shipment_${deliveryOrder.doNo}.csv`
  link.click();

  renderToteTable(toteMap);
}
function renderToteTable(map) {
  const container = document.getElementById("tableContainer");
  container.innerHTML = "";

  // Header
  const headerWrapper = document.createElement("div");
  headerWrapper.style.display = "flex";
  headerWrapper.style.justifyContent = "space-between";
  headerWrapper.style.alignItems = "center";
  headerWrapper.style.marginBottom = "8px";

  const header = document.createElement("h3");
  header.textContent = "Tote Information";
  headerWrapper.appendChild(header);

  container.appendChild(headerWrapper);

  // Table
  const table = document.createElement("table");
  table.id = "toteTable";
  table.style.borderCollapse = "collapse";
  table.style.width = "100%";
  table.border = "1";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th style="border: 1px solid #ccc; padding: 8px;">Tote ID</th>
      <th style="border: 1px solid #ccc; padding: 8px;">Barcode</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  map.forEach((barcodes, toteId) => {
    const row = document.createElement("tr");

    // Tote ID column
    const tdToteId = document.createElement("td");
    tdToteId.style.border = "1px solid #ccc";
    tdToteId.style.padding = "8px";

    const spanTote = document.createElement("span");
    spanTote.textContent = toteId;
    spanTote.style.marginRight = "8px";

    const copyToteBtn = document.createElement("button");
    copyToteBtn.className = "copy-button";
    copyToteBtn.style.border = "none";
    copyToteBtn.style.background = "none";
    copyToteBtn.style.cursor = "pointer";
    copyToteBtn.style.fontSize = "14px";
    copyToteBtn.style.color = "black";
    copyToteBtn.innerHTML = '<i class="fas fa-regular fa-copy"></i>';
    copyToteBtn.title = "Copy Tote ID";
    copyToteBtn.onclick = () => {
      navigator.clipboard.writeText(toteId).then(() => {
        copyToteBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
        copyToteBtn.disabled = true;
        setTimeout(() => {
          copyToteBtn.innerHTML = '<i class="fas fa-regular fa-copy"></i>';
          copyToteBtn.disabled = false;
        }, 1500);
      });
    };

    tdToteId.appendChild(copyToteBtn);
    tdToteId.appendChild(spanTote);

    // Barcode column
    const tdBarcodes = document.createElement("td");
    tdBarcodes.style.border = "1px solid #ccc";
    tdBarcodes.style.padding = "8px";

    const spanBarcode = document.createElement("span");
    const barcodeText = barcodes.join(", ");
    spanBarcode.textContent = barcodeText;
    spanBarcode.style.marginRight = "8px";

    const copyBarcodeBtn = document.createElement("button");
    copyBarcodeBtn.className = "copy-button";
    copyBarcodeBtn.style.border = "none";
    copyBarcodeBtn.style.background = "none";
    copyBarcodeBtn.style.cursor = "pointer";
    copyBarcodeBtn.style.fontSize = "14px";
    copyBarcodeBtn.style.color = "black";
    copyBarcodeBtn.innerHTML = '<i class="fas fa-regular fa-copy"></i>';
    copyBarcodeBtn.title = "Copy Barcode(s)";
    copyBarcodeBtn.onclick = () => {
      navigator.clipboard.writeText(barcodeText).then(() => {
        copyBarcodeBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
        copyBarcodeBtn.disabled = true;
        setTimeout(() => {
          copyBarcodeBtn.innerHTML = '<i class="fas fa-regular fa-copy"></i>';
          copyBarcodeBtn.disabled = false;
        }, 1500);
      });
    };

    tdBarcodes.appendChild(copyBarcodeBtn);
    tdBarcodes.appendChild(spanBarcode);

    // Add to row
    row.appendChild(tdToteId);
    row.appendChild(tdBarcodes);
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

function toggleGroupType() {
  var groupTypeOption = document.getElementById('groupType');
  var divDocNo = document.getElementById('divDocNo');
  if (groupTypeOption === null || divDocNo === null) return

  var selectedValue = groupTypeOption.value;
  if (selectedValue === 'STORE') {
    divDocNo.style.display = 'block';
  } else {
    divDocNo.style.display = 'none';
  }
}
