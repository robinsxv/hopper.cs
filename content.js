(() => {
    chrome.runtime.onMessage.addListener(async (obj, sender, response) => {
        const { skinHash } = obj;

        console.log('HopperCS Service-Worker ready.');

        const searchResultContainer = document.querySelector('#searchResultsRows');
        searchResultContainer.innerHTML = '<h2 style="text-align:center;color:#34d399;font-size:28px">Fetching...</h2>';

        var requestQuery = `https://steamcommunity.com/market/listings/730/${skinHash}/render/?query=&start=0&count=100&country=DE&language=english&currency=3&filter=Sticker`;

        let marketResponse;

        while (true) {
            try {
                marketResponse = await sendMarketRequest(requestQuery);
                if (marketResponse.success) {
                    displayResults(marketResponse, searchResultContainer);
                    break; // exit the loop if successful
                } else if(marketResponse.success == false) {
                    // wait for a short duration before retrying
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    console.error('Temporary IP-Ban. Please cool requests down.')
                    break;
                }
            } catch (error) {
                console.error('Error fetching market data:', error);
                // wait for a short duration before retrying
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    });
})();

async function sendMarketRequest(requestQuery) {
    var response = await fetch(requestQuery);
    var responseObject = await response.json();
    return responseObject;
}

function displayResults(response, container) {
    container.innerHTML = '';
    var skins = response.assets['730']['2'];
    var listingInfo = response.listinginfo;
    const currencyFormatter = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
    });
    for (var key in skins) {
        var skin = skins[key];
        var skinId = skin.id;
        var skinName = skin.market_name;
        var skinInspectLink = skin.actions['0'].link;
        var skinListingId = skinInspectLink.match(/(?<=%20M).*?(?=A%)/gm)[0];
        var skinStickersObj = extractStickerSrcFromHTML(skin.descriptions.slice(-1)[0].value);
        var skinImage = document.querySelector('.market_listing_largeimage img').src;
        var skinPrice = currencyFormatter.format(listingInfo[skinListingId].converted_price/100);
        var formattedStickersHTML = '';
        skinStickersObj.forEach(sticker => {
            formattedStickersHTML+=
            `<div style="margin:8px;display:flex;flex-direction:column;justify-content:center;align-items:center;">
                <img height=72 width=92 src="${sticker.src}">
                <p style="white-space:initial">${sticker.name}</p>
            </div>`;
        });
        container.insertAdjacentHTML('afterbegin',
            `
            <div class="market_listing_row" style="display:flex;justify-content:space-between;border-radius:10px;">
                <div style="margin:8px;text-align:center;">
                    <img height=128 width=128 src="${skinImage}">
                    <p>${skinName}</p>
                    <p style="font-size:24px;font-weight:bold;color:#34d399;margin:0">${skinPrice}</p>
                </div>
                <div style="display:flex;text-align:center;">${formattedStickersHTML}</div>
                <div style="display:flex;flex-direction: column;justify-content: center;margin: 8px;">
                    <button onclick="window.location.href='${skinInspectLink}'" style="padding:8px;margin:4px;background-color:#34d399;border:none;border-radius:5px;font-weight:bold;cursor:pointer;">Inspect</button>
                    <button onclick="BuyMarketListing('listing', '${skinListingId}', 730, '2', '${skinId}')" style="padding:8px;margin:4px;background-color:#34d399;border:none;border-radius:5px;font-weight:bold;cursor:pointer;">Buy</button>
                <div>
            </div>`
        );
    }
    container.insertAdjacentHTML('afterbegin', `<br><h2 style="font-size:32px;color:#34d399">HopperCS - Sticker Hunt</h2><br>`);
}

function extractStickerSrcFromHTML(stickersHTML) {
    var stickersObj = [];
    var parser = new DOMParser();
    var html = parser.parseFromString(stickersHTML, "text/html");
    var stickerNames = html.querySelector('center').innerText.replace('Sticker: ', '').split(', ');
    html.querySelectorAll('img').forEach((sticker, idx) => {
        stickersObj.push({
            src: sticker.src,
            name: stickerNames[idx]
        })
    });

    return stickersObj;
}