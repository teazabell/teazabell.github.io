const countType = null;

window.onload = function () {
  toggleInputBox();
  togglePackingOption();
};

document.addEventListener('DOMContentLoaded', function () {
  const packingOption = document.getElementById('packingOption');
  if (packingOption) {
    packingOption.value = 'SEPARATE_TOTE';
  }
});

function togglePackingOption() {
  var packingOption = document.getElementById('packingOption');
  var divOneTote = document.getElementById('one-tote-info');
  var divSparateTote = document.getElementById('separate-tote-info');
  if (packingOption === null || divOneTote === null || divSparateTote === null) return

  var selectedValue = packingOption.value;
  if (selectedValue === 'ONE_TOTE') {
    divOneTote.style.display = 'block';
    divSparateTote.style.display = 'none';
  } else {
    divSparateTote.style.display = 'block';
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
  } catch (error) {
    document.getElementById('confirmToteOutput').textContent = 'Invalid JSON';
    document.getElementById('confirmShipmentOutput').textContent = 'Invalid JSON';
  }
}

function confirmTote(deliveryOrder) {
  const details = [];
  const inputPrefixTote = document.getElementById('prefixTote').value;
  const prefixTotes = inputPrefixTote.split(',').map((prefix) => prefix.trim())

  const toteCode = document.getElementById('toteCode').value;
  let runningNumber = +document.getElementById('startRunningNumber').value;
  const packingOption = document.getElementById('packingOption').value;
  const toteId = document.getElementById('toteId').value;

  for (let i = 0; i < deliveryOrder.items.length; i++) {
    const doItem = deliveryOrder.items[i];
    const generateToteId = prefixTotes.length == 1 ? `${prefixTotes[0]}${toteCode}${String(runningNumber++).padStart(4, '0')}` :
      `${prefixTotes[i]}${toteCode}${String(runningNumber).padStart(4, '0')}`
    details.push({
      "referenceNo": deliveryOrder.doNo,
      "sku": doItem.articleNo,
      "toteId": packingOption === 'ONE_TOTE' ? toteId : generateToteId,
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

function generateDate(date) {
  const now = date ? new Date(date) : new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function clearDataDispatchOrder() {
  document.getElementById('inputDoDispatchOrder').value = '';
  document.getElementById('platNo').value = '';
  document.getElementById('driverName').value = '';
  document.getElementById('confirmToteOutput').textContent = '';
  document.getElementById('confirmShipmentOutput').textContent = '';
}

function copyToClipboard(elementId) {
  const outputElement = document.getElementById(elementId);
  const range = document.createRange();
  range.selectNode(outputElement);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  document.execCommand('copy');
  window.getSelection().removeAllRanges();
  alert('Copied to clipboard!');
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
  } else {
    processingThaiLocalSorting(false);
    icon.className = 'fas fa-sort-amount-up-alt';
    sortButton.textContent = ' Sort A to Z';
    sortButton.prepend(icon);
  }

  isAscending = !isAscending;
}

function processPrepareCreateStockCountGroup() {
  try {
    const docNo = document.getElementById('docNo').value;
    const deviceId = document.getElementById('deviceId').value;

    const items = this.countType == 'CLASS' ? generatePayloadTypeClass() : generatePayloadTypeArticle()

    const payload = {
      docNo: docNo,
      stockCountGroupType: "STORE",
      stockCountItemType: this.countType,
      items: items,
      deviceId: deviceId,
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