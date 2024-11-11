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
  const prefixTote = document.getElementById('prefixTote').value;
  const toteCode = document.getElementById('toteCode').value;
  let runningNumber = +document.getElementById('startRunningNumber').value;

  for (let i = 0; i < deliveryOrder.items.length; i++) {
    const doItem = deliveryOrder.items[i];
    details.push({
      "referenceNo": deliveryOrder.doNo,
      "sku": doItem.articleNo,
      "toteId": `${prefixTote}${toteCode}${String(runningNumber++).padStart(4, '0')}`,
      "qtyOrdered": doItem.qty
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
      "qtyShipped": doItem.qty,
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
    const subject = document.getElementById('subject').value;
    const itemType = document.getElementById('itemType').value;

    const inputCodes = document.getElementById('inputCodes').value;
    const items = inputCodes.split(",").map((item) => item.trim());

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
}

function toggleInputBox() {
  var selectBox = document.getElementById('selectStore');
  var divInputStores = document.getElementById('divInputStores');
  
  var selectedValue = selectBox.value;
  
  if (selectedValue === 'OTHER') {
    divInputStores.style.display = 'block';
  } else {
    divInputStores.style.display = 'none';
  }
}
window.onload = function() {
  toggleInputBox();
};