function processJson() {
  try {
    const deliveryOrder = document.getElementById('inputDo').value;

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

function clearData() {
  document.getElementById('inputDo').value = '';
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
