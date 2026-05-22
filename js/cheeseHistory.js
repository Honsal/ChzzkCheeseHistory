window.CCH = {
    channels: [],
    channel: null
};

async function initCheeseApi() {
    const cheeseDataArr = await getCheeseHistoryJson();
    
    CCH.channels = [];
    CCH.channel = null;
    
    convertCheeseDataArrToChannelData(cheeseDataArr);

    initCheeseHtml();
}

async function getCheeseHistoryJson() {
    const result = [];
    
    for(const year of CCH_UTIL.yearArr) {
        try {
            const res = await fetch(
                `https://api.chzzk.naver.com/commercial/v1/product/purchase/history?page=0&size=50000&searchYear=${year}`,
                {
                    headers: {
                        "accept": "application/json, text/plain, */*",
                        "cache-control": "no-cache",
                        "pragma": "no-cache"
                    },
                    method: "GET",
                    credentials: "include"
                }
            );

            if(!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();

            if(data.code !== 200) throw new Error(data.message);

            result.push(...(data?.content?.data || []));
        } catch (error) {
            console.error(`${year}년 조회 실패`, error);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return result;
}

function convertCheeseDataArrToChannelData(cheeseDataArr) {
    if(cheeseDataArr) {
        cheeseDataArr.sort((a, b) => {
            if(a.purchaseDate < b.purchaseDate) return -1;
            if(a.purchaseDate > b.purchaseDate) return 1;
            return 0;
        });

        for(let cheeseData of cheeseDataArr) {
            let splitedPurchaseDate = cheeseData.purchaseDate.split(' ')[0].split('-');
            let purchaseYear = Number(splitedPurchaseDate[0]);
            let purchaseMonth = Number(splitedPurchaseDate[1]);
            let purchaseDay = Number(splitedPurchaseDate[2]);
            let payAmount = Number(cheeseData.payAmount);

            let channelData = CCH.channels.find(channel => channel.channelId === cheeseData.channelId);
            if(!channelData) {
                channelData = createCheeseChannelData(cheeseData);
                CCH.channels.push(channelData);
            }

            let yearData = channelData.yearData.find(data => data.year === purchaseYear);
            if(!yearData) {
                yearData = {
                    year: purchaseYear,
                    yearTotal: 0,
                    yearCount: 0,
                    yearTtsTotal: 0,
                    yearTtsCount: 0,
                    monthData: []
                }
                channelData.yearData.push(yearData);
            }

            if(cheeseData.donationType === "TTS") {
                yearData.yearTtsTotal += payAmount;
                yearData.yearTtsCount++;
            } else {
                yearData.yearTotal += payAmount;
                yearData.yearCount++;
            }
            
            let monthData = yearData.monthData.find(data => data.month === purchaseMonth);
            if(!monthData) {
                monthData = {
                    month: purchaseMonth,
                    monthTotal: 0,
                    monthCount: 0,
                    monthTtsTotal: 0,
                    monthTtsCount: 0,
                    dayData: []
                }
                yearData.monthData.push(monthData);
            }


            if(cheeseData.donationType === "TTS") {
                monthData.monthTtsTotal += payAmount;
                monthData.monthTtsCount++;
            } else {
                monthData.monthTotal += payAmount;
                monthData.monthCount++;
            }

            let dayData = monthData.dayData.find(data => data.day === purchaseDay);
            if(!dayData) {
                dayData = {
                    day: purchaseDay,
                    dayTotal: 0,
                    dayCount: 0,
                    dayTtsTotal: 0,
                    dayTtsCount: 0
                }
                monthData.dayData.push(dayData);
            }

            if(cheeseData.donationType === "TTS") {
                dayData.dayTtsTotal += payAmount;
                dayData.dayTtsCount++;
            } else {
                dayData.dayTotal += payAmount;
                dayData.dayCount++;
            }
        }
    }
}

function initCheeseHtml() {
    if(window.monthlyChart instanceof Chart) {
        window.monthlyChart.destroy();
    }

    rebuildCheeseChannels();

    let totalPayAmount = 0;
    let totalTtsPayAmount = 0;
    for(let channel of CCH.channels) {
        totalPayAmount += channel.channelTotal;
        totalTtsPayAmount += channel.channelTtsTotal;
    }

    document.getElementById("channelInfo").innerText = '';
    document.getElementById("channelInfoYear").innerText = '';

    let totalPayAmountHtml = `전체 후원 금액 : ${totalPayAmount.toLocaleString("ko-KR")}원`;
    if(totalTtsPayAmount > 0) {
         totalPayAmountHtml += ` [TTS : ${totalTtsPayAmount.toLocaleString("ko-KR")}원]`;
    }
    document.getElementById("totalPayAmount").innerText = totalPayAmountHtml;
    document.getElementById("channelListContainer").innerHTML = makeCheeseList(CCH.channels);
    if(CCH.channels.length > 0) {
        document.getElementById("channelListContainer").dataset.visible = "block";
    }
}

function makeCheeseList(channels) {
    let sortType = document.querySelector("input[name='sortType']:checked")?.value;
    let sortedChannels = [...channels];
    if('total' === sortType) {
        sortedChannels.sort((a, b) => b.channelTotal - a.channelTotal);
    }

    let html = `
    <div id="cch_channelList">
        ${sortedChannels.map(channel => `
            <button onclick="getCheeseHistory('${channel.channelId}');">
                <span>
                    <img class="cheeseImg" 
                        ${
                            channel.cheese04 ? 'src="https://ssl.pstatic.net/static/nng/glive/badge/cheese04.png"' :
                            channel.cheese03 ? 'src="https://ssl.pstatic.net/static/nng/glive/badge/cheese03.png"' :
                            channel.cheese02 ? 'src="https://ssl.pstatic.net/static/nng/glive/badge/cheese02.png"' :
                            channel.cheese01 ? 'src="https://ssl.pstatic.net/static/nng/glive/badge/cheese01.png"' : ''
                        }
                    >
                    <img class="channelImg" src="${channel.channelImageUrl}" />
                </span>
                <p>${channel.channelName}</p>
                <p>${Number(channel.channelTotal).toLocaleString("ko-KR")}원</p>
            </button>
        `).join('')}
    </div>`;

    return html;
}

function getCheeseHistory(channelId) {
    let channelInfoYear = '';
    CCH.channel = CCH.channels.find(channel => channel.channelId === channelId);
    

    let channelInfoHtml = `${CCH.channel.channelName} 총 후원 금액 : ${Number(CCH.channel.channelTotal).toLocaleString("ko-KR")}원 (${CCH.channel.channelCount.toLocaleString("ko-KR")}회)`;
    if(CCH.channel.channelTtsCount > 0) {
        channelInfoHtml += ` [TTS : ${Number(CCH.channel.channelTtsTotal).toLocaleString("ko-KR")}원 (${CCH.channel.channelTtsCount}회)]`;
    }
    document.getElementById("channelInfo").innerText = channelInfoHtml;

    if(CCH.channel.yearData.length > 0) {
        let yearIdx = -1;
        for(let year of CCH_UTIL.yearArr) {
            yearIdx = CCH.channel.yearData.findIndex(data => data.year === year);
            if(yearIdx !== -1) {
                let yearData = CCH.channel.yearData[yearIdx];
                channelInfoYear += `<li>${yearData.year}년 : ${Number(yearData.yearTotal).toLocaleString("ko-KR")}원 (${yearData.yearCount}회)`;
                if(yearData.yearTtsCount > 0) {
                    channelInfoYear += ` [TTS : ${Number(yearData.yearTtsTotal).toLocaleString("ko-KR")}원 (${yearData.yearTtsCount}회)]`;
                }
                channelInfoYear += `</li>`;

                yearIdx = -1;
            }
        }
    }
    document.getElementById("channelInfoYear").innerHTML = channelInfoYear;
    
    renderMonthlyCheeseChart();
    rendarCheeseCalendar();
    chgView('Graph');
}

function renderMonthlyCheeseChart() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');

    if (window.monthlyChart instanceof Chart) {
        window.monthlyChart.destroy();
    }

    window.monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
            datasets: makeCheeseChartDatasets()
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return `${tooltipItems[0].dataset.label} ${tooltipItems[0].label}`;
                        },
                        label: function(tooltipItem) {
                            return `후원 금액: ${tooltipItem.formattedValue}원`;
                        },
                        footer: function(tooltipItem) {
                            let year = Number(tooltipItem[0].dataset.label.replace(/[^0-9]/g, ''));
                            let yearData = CCH.channel.yearData.find(data => data.year === year);
                            let dataIdx = tooltipItem[0].dataIndex;
                            let monthCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

                            if(yearData) {
                                let monthData = null;
                                for(let month of CCH_UTIL.monthArr) {
                                    monthData = yearData.monthData.find(data => data.month === month);
                                    if(monthData) {
                                        monthCount[month - 1] = monthData.monthCount;
                                    }
                                }
                            }

                            return `후원 횟수: ${monthCount[dataIdx].toLocaleString("ko-KR")}회`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '후원 금액 (원)'
                    }
                }
            }
        }
    });
}

function makeCheeseChartDatasets() {
    let datasets = [];
    let yearIdx = -1;
    let yearData = null;
    let monthIdx = -1;
    let monthTotal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    for(let year of CCH_UTIL.yearArr) {
        yearIdx = CCH.channel.yearData.findIndex(data => data.year === year);
        if(yearIdx !== -1) {
            yearData = CCH.channel.yearData[yearIdx];

            for(let month of CCH_UTIL.monthArr) {
                monthIdx = yearData.monthData.findIndex(data => data.month === month);
                if(monthIdx !== -1) {
                    monthTotal[month - 1] = yearData.monthData[monthIdx].monthTotal;
                }
            }

            datasets.push({
                label: `${CCH.channel.yearData[yearIdx].year}년`,
                data: monthTotal
            });
            
            yearIdx = -1;
            yearData = null;
            monthIdx = -1;
            monthTotal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        }
    }

    return datasets;
}

function rendarCheeseCalendar(focusDay) {
    let yearData = null;
    let monthData = null;
    let dayData = null;

    if(CCH.channel) {
        yearData = CCH.channel.yearData.find(data => data.year === CCH_UTIL.year);
        monthData = yearData ? yearData.monthData.find(data => data.month === CCH_UTIL.month) : null;
        
        let monthTotalHtml = `<h3>${CCH_UTIL.month}월 후원 금액: 0원 (0회)</h3>`;
        if(monthData) {
            monthTotalHtml = `<h3>${CCH_UTIL.month}월 후원 금액 : ${Number(monthData.monthTotal).toLocaleString("ko-KR")}원 (${monthData.monthCount}회)`;
            if(monthData.monthTtsCount > 0) {
                monthTotalHtml += `<br>TTS : ${Number(monthData.monthTtsTotal).toLocaleString("ko-KR")}원 (${monthData.monthTtsCount}회)`;
            }
            monthTotalHtml += `</h3>`;
        }
        document.getElementsByClassName("calendar_month_total")[0].innerHTML = monthTotalHtml;

        document.getElementsByClassName("cheese_history")[0].innerHTML = `
        <ul>
            <li><button onclick="goToday();"><h4>TODAY</h4></button></li>
            ${CCH.channel.onedayMaxCheese > 0 ? `<li><button onclick="goDate('${CCH.channel.onedayMaxCheeseDate}');"><h4>일일최고금액 : ${Number(CCH.channel.onedayMaxCheese).toLocaleString("ko-KR")}원</h4></button></li>` : ''}
            ${CCH.channel.cheese01 ? `<li><button onclick="goDate('${CCH.channel.cheeseDate01}');"><img src="https://ssl.pstatic.net/static/nng/glive/badge/cheese01.png" class="cheese_history_button"></button></li>` : ''}
            ${CCH.channel.cheese02 ? `<li><button onclick="goDate('${CCH.channel.cheeseDate02}');"><img src="https://ssl.pstatic.net/static/nng/glive/badge/cheese02.png" class="cheese_history_button"></button></li>` : ''}
            ${CCH.channel.cheese03 ? `<li><button onclick="goDate('${CCH.channel.cheeseDate03}');"><img src="https://ssl.pstatic.net/static/nng/glive/badge/cheese03.png" class="cheese_history_button"></button></li>` : ''}
            ${CCH.channel.cheese04 ? `<li><button onclick="goDate('${CCH.channel.cheeseDate04}');"><img src="https://ssl.pstatic.net/static/nng/glive/badge/cheese04.png" class="cheese_history_button"></button></li>` : ''}
        </ul>`;
    }
    
    document.getElementsByClassName("calendarDate")[0].innerText = `${CCH_UTIL.year}년 ${CCH_UTIL.month}월`;

    const prevLast = new Date(CCH_UTIL.year, CCH_UTIL.month - 1, 0);
    const thisLast = new Date(CCH_UTIL.year, CCH_UTIL.month, 0);

    const PLDate = prevLast.getDate();
    const PLDay = prevLast.getDay();

    const TLDate = thisLast.getDate();
    const TLDay = thisLast.getDay();

    const prevDates = [];
    const thisDates = [...Array(TLDate + 1).keys()].slice(1);
    const nextDates = [];

    if(PLDay !== 6) {
        for(let i = 0; i < PLDay + 1; i++) {
            prevDates.unshift(PLDate - i);
        }
    }

    for(let i = 1; i < 7 - TLDay; i++) {
        nextDates.push(i);
    }

    const dates = prevDates.concat(thisDates, nextDates);

    const firstDateIndex = dates.indexOf(1);
    const lastDateIndex = dates.lastIndexOf(TLDate);

    dates.forEach((date, i) => {
        const condition = i >= firstDateIndex && i < lastDateIndex + 1 ? 'this' : 'other';
        
        if(i % 7 === 0) dates[i] = `<tr><td class="date">`;
        else dates[i] = `<td class="date">`;

        dates[i] += `
        <span class="${condition}">
            <h4>${date} 
                    ${i >= firstDateIndex && i < lastDateIndex + 1 && CCH.channel ? `<span class="cheeseDate_span">
                        ${CCH.channel.firstCheeseDate === makeDate(CCH_UTIL.year, CCH_UTIL.month, date) ? '<img src="https://ssl.pstatic.net/static/nng/glive/badge/fan_03.png" class="cheeseDate">' : ''}
                        ${CCH.channel.cheese01 && CCH.channel.cheeseDate01 === makeDate(CCH_UTIL.year, CCH_UTIL.month, date) ? '<img src="https://ssl.pstatic.net/static/nng/glive/badge/cheese01.png" class="cheeseDate">' : ''}
                        ${CCH.channel.cheese02 && CCH.channel.cheeseDate02 === makeDate(CCH_UTIL.year, CCH_UTIL.month, date) ? '<img src="https://ssl.pstatic.net/static/nng/glive/badge/cheese02.png" class="cheeseDate">' : ''}
                        ${CCH.channel.cheese03 && CCH.channel.cheeseDate03 === makeDate(CCH_UTIL.year, CCH_UTIL.month, date) ? '<img src="https://ssl.pstatic.net/static/nng/glive/badge/cheese03.png" class="cheeseDate">' : ''}
                        ${CCH.channel.cheese04 && CCH.channel.cheeseDate04 === makeDate(CCH_UTIL.year, CCH_UTIL.month, date) ? '<img src="https://ssl.pstatic.net/static/nng/glive/badge/cheese04.png" class="cheeseDate">' : ''}
                    </span>` : ''}
                </h4>
        </span>`;

        dates[i] += `<div class="date_inner"><ul>`;
        
        if(monthData) {
            dayData = monthData.dayData.find(data => data.day === date);
            if(i >= firstDateIndex && i < lastDateIndex + 1 && dayData) {
                dates[i] += `
                    <li>${Number(dayData.dayTotal).toLocaleString("ko-KR")}원</li>
                    <li>(${dayData.dayCount.toLocaleString("ko-KR")}회)</li>
                `;

                if(dayData.dayTtsCount > 0) {
                    dates[i] += `<li>[TTS : ${Number(dayData.dayTtsTotal).toLocaleString("ko-KR")}원 (${dayData.dayTtsCount}회)]</li>`;
                }
            }

            dayData = null;
        }

        dates[i] += `</ul></div></td>`;
        
        if(i % 7 === 6) dates[i] += `</tr>`;
    });

    document.querySelector(".dates").innerHTML = dates.join('');
    
    const today = new Date();
    if(CCH_UTIL.month === today.getMonth() + 1 && CCH_UTIL.year === today.getFullYear()) {
        for(let date of document.querySelectorAll('.date .this')) {
            if(Number(date.innerText) === today.getDate()) {
                date.closest(".date").classList.add('today');
                break;
            }
        }
    }

    if(focusDay != null && focusDay > 0) {
        for(let date of document.querySelectorAll('.date .this')) {
            if(Number(date.innerText) === focusDay) {
                date.closest(".date").classList.add('focus_day');
                break;
            }
        }
    }
}

function rebuildCheeseChannels() {
    if(CCH.channels[0] !== '') {
        CCH.channels.sort((a, b) => a.channelName.localeCompare(b.channelName));

        for(let channel of CCH.channels) {
            channel.channelTotal = 0;
            channel.channelCount = 0;
            channel.channelTtsTotal = 0;
            channel.channelTtsCount = 0;
            channel.cheese01 = false;
            channel.cheeseDate01 = null;
            channel.cheese02 = false;
            channel.cheeseDate02 = null;
            channel.cheese03 = false;
            channel.cheeseDate03 = null;
            channel.cheese04 = false;
            channel.cheeseDate04 = null;
            channel.firstCheeseDate = null;
            channel.onedayMaxCheese = 0;
            channel.onedayMaxCheeseDate = null;

            channel.yearData.sort((a, b) => a.year - b.year);

            for(let year of CCH_UTIL.yearArr) {
                let yearData = channel.yearData.find(data => data.year === year);

                if(yearData) {
                    for(let month of CCH_UTIL.monthArr) {
                        let monthData = yearData.monthData.find(data => data.month === month);
                        
                        if(monthData && monthData.dayData) {
                            for(let dayData of monthData.dayData) {
                                channel.channelTotal += dayData.dayTotal;
                                channel.channelCount += dayData.dayCount;
                                channel.channelTtsTotal += dayData.dayTtsTotal;
                                channel.channelTtsCount += dayData.dayTtsCount;

                                if(!channel.firstCheeseDate) channel.firstCheeseDate = makeDate(year, month, dayData.day);
                                else if(!channel.firstCheeseDate.localeCompare(makeDate(year, month, dayData.day))) channel.firstCheeseDate = makeDate(year, month, dayData.day);
                                
                                if(!channel.cheese01 && channel.channelTotal >= 100_000) {
                                    channel.cheese01 = true;
                                    channel.cheeseDate01 = makeDate(year, month, dayData.day);
                                }
                                
                                if(!channel.cheese02 && channel.channelTotal >= 1_000_000) {
                                    channel.cheese02 = true;
                                    channel.cheeseDate02 = makeDate(year, month, dayData.day);
                                }
                                
                                if(!channel.cheese03 && channel.channelTotal >= 10_000_000) {
                                    channel.cheese03 = true;
                                    channel.cheeseDate03 = makeDate(year, month, dayData.day);
                                }
                                
                                if(!channel.cheese04 && channel.channelTotal >= 100_000_000) {
                                    channel.cheese04 = true;
                                    channel.cheeseDate04 = makeDate(year, month, dayData.day);
                                }

                                if(channel.onedayMaxCheese < dayData.dayTotal) {
                                    channel.onedayMaxCheese = dayData.dayTotal;
                                    channel.onedayMaxCheeseDate = makeDate(year, month, dayData.day);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function createCheeseChannelData(channelData) {
    return {
        channelId: channelData.channelId,
        channelName: channelData.channelName,
        channelImageUrl: channelData.channelImageUrl,
        channelTotal: 0,
        channelCount: 0,
        channelTtsTotal: 0,
        channelTtsCount: 0,
        cheese01: false,
        cheeseDate01: null,
        cheese02: false,
        cheeseDate02: null,
        cheese03: false,
        cheeseDate03: null,
        cheese04: false,
        cheeseDate04: null,
        firstCheeseDate: null,
        onedayMaxCheese: 0,
        onedayMaxCheeseDate: null,
        yearData: []
    }
}