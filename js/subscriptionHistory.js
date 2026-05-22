window.CSH = {
    channels: [],
    channel: null
};

async function initSubscriptionApi() {
    const subscriptionDataArr = await getSubscriptionHistoryJson();
    
    CSH.channels = [];
    CSH.channel = null;
    
    convertSubscriptionDataArrToChannelData(subscriptionDataArr);

    initSubscriptionHtml();
}

async function getSubscriptionHistoryJson() {
    const result = [];

    const res = await fetch(
        "https://api.chzzk.naver.com/commercial/v1/gift/subscription/send-history?page=0&size=50000",
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

    return result;
}

function convertSubscriptionDataArrToChannelData(subscriptionDataArr) {
    if(subscriptionDataArr) {
        subscriptionDataArr.sort((a, b) => {
            if(a.historyDate < b.historyDate) return -1;
            if(a.historyDate > b.historyDate) return 1;
            return 0;
        });

        for(let subscriptionData of subscriptionDataArr) {
            let splitedHistoryDate = subscriptionData.historyDate.split(' ')[0].split('-');
            let historyYear = Number(splitedHistoryDate[0]);
            let historyMonth = Number(splitedHistoryDate[1]);
            let historyDay = Number(splitedHistoryDate[2]);

            let historyStatus = subscriptionData.historyStatus;
            let tier = subscriptionData.tier;
            let quantity = subscriptionData.historyQuantity;

            let channelData = CSH.channels.find(channel => channel.channelId === subscriptionData.channelId);
            if(!channelData) {
                channelData = createSubscriptionChannelData(subscriptionData);
                CSH.channels.push(channelData);
            }

            let yearData = channelData.yearData.find(data => data.year === historyYear);
            if(!yearData) {
                yearData = {
                    year: historyYear,
                    yearTotal: 0,
                    yearCount1: 0,
                    yearCount2: 0,
                    yearCancel1: 0,
                    yearCancel2: 0,
                    monthData: []
                }
                channelData.yearData.push(yearData);
            }
            
            let monthData = yearData.monthData.find(data => data.month === historyMonth);
            if(!monthData) {
                monthData = {
                    month: historyMonth,
                    monthTotal: 0,
                    monthCount1: 0,
                    monthCount2: 0,
                    monthCancel1: 0,
                    monthCancel2: 0,
                    dayData: []
                }
                yearData.monthData.push(monthData);
            }

            let dayData = monthData.dayData.find(data => data.day === historyDay);
            if(!dayData) {
                dayData = {
                    day: historyDay,
                    dayTotal: 0,
                    dayCount1: 0,
                    dayCount2: 0,
                    dayCancel1: 0,
                    dayCancel2: 0,
                }
                monthData.dayData.push(dayData);
            }

            if("COMPLETED" === historyStatus) {
                yearData.yearTotal += quantity;
                monthData.monthTotal += quantity;
                dayData.dayTotal += quantity;

                if("TIER_1" === tier) {
                    yearData.yearCount1 += quantity;
                    monthData.monthCount1 += quantity;
                    dayData.dayCount1 += quantity;
                } else if("TIER_2" === tier) {
                    yearData.yearCount2 += quantity;
                    monthData.monthCount2 += quantity;
                    dayData.dayCount2 += quantity;
                }
            } else if("PARTIAL_REFUND" === historyStatus) {
                yearData.yearTotal -= quantity;
                monthData.monthTotal -= quantity;
                dayData.dayTotal -= quantity;

                if("TIER_1" === tier) {
                    yearData.yearCount1 -= quantity;
                    monthData.monthCount1 -= quantity;
                    dayData.dayCount1 -= quantity;

                    yearData.yearCancel1 += quantity;
                    monthData.monthCancel1 += quantity;
                    dayData.dayCancel1 += quantity;
                } else if("TIER_2" === tier) {
                    yearData.yearCount2 -= quantity;
                    monthData.monthCount2 -= quantity;
                    dayData.dayCount2 -= quantity;

                    yearData.yearCancel2 += quantity;
                    monthData.monthCancel2 += quantity;
                    dayData.dayCancel2 += quantity;
                }
            }
        }
    }
}

function initSubscriptionHtml() {
    if(window.monthlyChart instanceof Chart) {
        window.monthlyChart.destroy();
    }

    rebuildSubscriptionChannels();

    let total = 0;
    let count1 = 0;
    let count2 = 0;
    for(let channel of CSH.channels) {
        total += channel.channelTotal;
        count1 += channel.channelCount1;
        count2 += channel.channelCount2;
    }

    document.getElementById("channelInfo").innerText = '';
    document.getElementById("channelInfoYear").innerText = '';
    document.getElementById("totalPayAmount").innerText = `구독선물 횟수 : ${total}회(All) / ${count1}회(1T) / ${count2}회(2T)`;
    document.getElementById("channelListContainer").innerHTML = makeSubscriptionList(CSH.channels);
    if(CSH.channels.length > 0) {
        document.getElementById("channelListContainer").dataset.visible = "block";
    }
}

function makeSubscriptionList(channels) {
    let sortType = document.querySelector("input[name='sortType']:checked")?.value;
    let sortedChannels = [...channels];
    if('total' === sortType) {
        sortedChannels.sort((a, b) => b.channelTotal - a.channelTotal);
    }

    let html = `
    <div id="cch_channelList">
        ${sortedChannels.map(channel => `
            <button onclick="getSubscriptionHistory('${channel.channelId}');">
                <span>
                    <img class="cheeseImg" 
                        ${
                            channel.subscription1000 ? 'src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_1000.png"' :
                            channel.subscription500 ? 'src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_500.png"' :
                            channel.subscription250 ? 'src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_250.png"' :
                            channel.subscription100 ? 'src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_100.png"' :
                            channel.subscription50 ? 'src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_50.png"' :
                            channel.subscription10 ? 'src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_10.png"' :
                            channel.subscription1 ? 'src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_1.png"' : ''
                        }
                    >
                    <img class="channelImg" src="${channel.channelImageUrl}" />
                </span>
                <p>${channel.channelName}</p>
                <p>총 ${Number(channel.channelTotal).toLocaleString("ko-KR")}회</p>
            </button>
        `).join('')}
    </div>`;

    return html;
}

function getSubscriptionHistory(channelId) {
    let channelInfoYear = '';
    CSH.channel = CSH.channels.find(channel => channel.channelId === channelId);
    
    document.getElementById("channelInfo").innerText = `${CSH.channel.channelName} 구독선물 횟수 : ${Number(CSH.channel.channelTotal).toLocaleString("ko-KR")}회(ALL) / ${Number(CSH.channel.channelCount1).toLocaleString("ko-KR")}회(1T) / ${Number(CSH.channel.channelCount2).toLocaleString("ko-KR")}회(2T)`;

    if(CSH.channel.yearData.length > 0) {
        let yearIdx = -1;
        for(let year of CCH_UTIL.yearArr) {
            yearIdx = CSH.channel.yearData.findIndex(data => data.year === year);
            if(yearIdx !== -1) {
                channelInfoYear += `<li>${CSH.channel.yearData[yearIdx].year}년 : ${Number(CSH.channel.yearData[yearIdx].yearTotal).toLocaleString("ko-KR")}회(ALL) / ${Number(CSH.channel.yearData[yearIdx].yearCount1).toLocaleString("ko-KR")}회(1T) / ${Number(CSH.channel.yearData[yearIdx].yearCount2).toLocaleString("ko-KR")}회(2T)</li>`;
                yearIdx = -1;
            }
        }
    }
    document.getElementById("channelInfoYear").innerHTML = channelInfoYear;
    
    renderMonthlySubscriptionChart();
    rendarSubscriptionCalendar();
    chgView('Graph');
}

function renderMonthlySubscriptionChart() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');

    if (window.monthlyChart instanceof Chart) {
        window.monthlyChart.destroy();
    }

    window.monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
            datasets: makeSubscriptionChartDatasets()
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return `${tooltipItems[0].dataset.label} ${tooltipItems[0].label}`;
                        },
                        label: function(tooltipItem) {
                            return `총 구독선물 횟수: ${tooltipItem.formattedValue}회`;
                        },
                        footer: function(tooltipItem) {
                            let year = Number(tooltipItem[0].dataset.label.replace(/[^0-9]/g, ''));
                            let yearData = CSH.channel.yearData.find(data => data.year === year);
                            let dataIdx = tooltipItem[0].dataIndex;
                            let monthCount = ["", "", "", "", "", "", "", "", "", "", "", ""];

                            if(yearData) {
                                let monthData = null;
                                for(let month of CCH_UTIL.monthArr) {
                                    monthData = yearData.monthData.find(data => data.month === month);
                                    if(monthData) {
                                        monthCount[month - 1] = `${monthData.monthCount1}회(1T) / ${monthData.monthCount2}회(2T)`;
                                    }
                                }
                            }

                            return `티어별 구독선물 횟수: ${monthCount[dataIdx]}`;
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
                        text: '구독선물 횟수'
                    }
                }
            }
        }
    });
}

function makeSubscriptionChartDatasets() {
    let datasets = [];
    let yearIdx = -1;
    let yearData = null;
    let monthIdx = -1;
    let monthTotal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    for(let year of CCH_UTIL.yearArr) {
        yearIdx = CSH.channel.yearData.findIndex(data => data.year === year);
        if(yearIdx !== -1) {
            yearData = CSH.channel.yearData[yearIdx];

            for(let month of CCH_UTIL.monthArr) {
                monthIdx = yearData.monthData.findIndex(data => data.month === month);
                if(monthIdx !== -1) {
                    monthTotal[month - 1] = yearData.monthData[monthIdx].monthTotal;
                }
            }

            datasets.push({
                label: `${CSH.channel.yearData[yearIdx].year}년`,
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

function rendarSubscriptionCalendar(focusDay) {
    let yearData = null;
    let monthData = null;
    let dayData = null;

    if(CSH.channel) {
        yearData = CSH.channel.yearData.find(data => data.year === CCH_UTIL.year);
        monthData = yearData ? yearData.monthData.find(data => data.month === CCH_UTIL.month) : null;

        document.getElementsByClassName("calendar_month_total")[0].innerHTML = monthData ? `<h3>${Number(monthData.monthTotal).toLocaleString("ko-KR")}회(All) / ${Number(monthData.monthCount1).toLocaleString("ko-KR")}회(1T) / ${Number(monthData.monthCount2).toLocaleString("ko-KR")}회(2T)</h3>` : `<h3>0회(All) / 0회(1T) / 0회(2T)</h3>`;
        document.getElementsByClassName("cheese_history")[0].innerHTML = `
        <ul>
            <li><button onclick="goToday();"><h4>TODAY</h4></button></li>
            ${CSH.channel.subscription1 ? `<li><button onclick="goDate('${CSH.channel.subscriptionDate1}');"><img src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_1.png" class="cheese_history_button"></button></li>` : ''}
            ${CSH.channel.subscription10 ? `<li><button onclick="goDate('${CSH.channel.subscriptionDate10}');"><img src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_10.png" class="cheese_history_button"></button></li>` : ''}
            ${CSH.channel.subscription50 ? `<li><button onclick="goDate('${CSH.channel.subscriptionDate50}');"><img src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_50.png" class="cheese_history_button"></button></li>` : ''}
            ${CSH.channel.subscription100 ? `<li><button onclick="goDate('${CSH.channel.subscriptionDate100}');"><img src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_100.png" class="cheese_history_button"></button></li>` : ''}
            ${CSH.channel.subscription250 ? `<li><button onclick="goDate('${CSH.channel.subscriptionDate250}');"><img src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_250.png" class="cheese_history_button"></button></li>` : ''}
            ${CSH.channel.subscription500 ? `<li><button onclick="goDate('${CSH.channel.subscriptionDate500}');"><img src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_500.png" class="cheese_history_button"></button></li>` : ''}
            ${CSH.channel.subscription1000 ? `<li><button onclick="goDate('${CSH.channel.subscriptionDate1000}');"><img src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_1000.png" class="cheese_history_button"></button></li>` : ''}
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
                    ${i >= firstDateIndex && i < lastDateIndex + 1 && CSH.channel ? `<span class="cheeseDate_span">
                        ${CSH.channel.subscription1 && CSH.channel.subscriptionDate1 === makeDate(CCH_UTIL.year, CCH_UTIL.month, date) ? '<img src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_1.png" class="cheeseDate">' : ''}
                        ${CSH.channel.subscription10 && CSH.channel.subscriptionDate10 === makeDate(CCH_UTIL.year, CCH_UTIL.month, date) ? '<img src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_10.png" class="cheeseDate">' : ''}
                        ${CSH.channel.subscription50 && CSH.channel.subscriptionDate50 === makeDate(CCH_UTIL.year, CCH_UTIL.month, date) ? '<img src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_50.png" class="cheeseDate">' : ''}
                        ${CSH.channel.subscription100 && CSH.channel.subscriptionDate100 === makeDate(CCH_UTIL.year, CCH_UTIL.month, date) ? '<img src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_100.png" class="cheeseDate">' : ''}
                        ${CSH.channel.subscription250 && CSH.channel.subscriptionDate250 === makeDate(CCH_UTIL.year, CCH_UTIL.month, date) ? '<img src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_250.png" class="cheeseDate">' : ''}
                        ${CSH.channel.subscription500 && CSH.channel.subscriptionDate500 === makeDate(CCH_UTIL.year, CCH_UTIL.month, date) ? '<img src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_500.png" class="cheeseDate">' : ''}
                        ${CSH.channel.subscription1000 && CSH.channel.subscriptionDate1000 === makeDate(CCH_UTIL.year, CCH_UTIL.month, date) ? '<img src="https://ssl.pstatic.net/static/nng/glive/badge/gift_sub_1000.png" class="cheeseDate">' : ''}
                    </span>` : ''}
                </h4>
        </span>`;

        dates[i] += `<div class="date_inner"><ul>`;
        
        if(monthData) {
            dayData = monthData.dayData.find(data => data.day === date);
            if(i >= firstDateIndex && i < lastDateIndex + 1 && dayData) {
                dates[i] += `
                    <li>ALL : ${dayData.dayTotal}회</li>
                    <li>1T : ${dayData.dayCount1}회</li>
                    <li>2T : ${dayData.dayCount2}회</li>
                `;
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

function rebuildSubscriptionChannels() {
    if(CSH.channels[0] !== '') {
        CSH.channels.sort((a, b) => a.channelName.localeCompare(b.channelName));

        for(let channel of CSH.channels) {
            channel.channelTotal = 0;
            channel.channelCount1 = 0;
            channel.channelCount2 = 0;
            channel.subscription1 = false;
            channel.subscriptionDate1 = null;
            channel.subscription10 = false;
            channel.subscriptionDate10 = null;
            channel.subscription50 = false;
            channel.subscriptionDate50 = null;
            channel.subscription100 = false;
            channel.subscriptionDate100 = null;
            channel.subscription250 = false;
            channel.subscriptionDate250 = null;
            channel.subscription500 = false;
            channel.subscriptionDate500 = null;
            channel.subscription1000 = false;
            channel.subscriptionDate1000 = null;

            channel.yearData.sort((a, b) => a.year - b.year);

            for(let year of CCH_UTIL.yearArr) {
                let yearData = channel.yearData.find(data => data.year === year);
                if(yearData) {
                    for(let month of CCH_UTIL.monthArr) {
                        let monthData = yearData.monthData.find(data => data.month === month);
                        
                        if(monthData && monthData.dayData) {
                            for(let dayData of monthData.dayData) {
                                channel.channelTotal += dayData.dayTotal;
                                channel.channelCount1 += dayData.dayCount1;
                                channel.channelCount2 += dayData.dayCount2;
                                
                                if(!channel.subscription1 && channel.channelTotal >= 1) {
                                    channel.subscription1 = true;
                                    channel.subscriptionDate1 = makeDate(year, month, dayData.day);
                                }

                                if(!channel.subscription10 && channel.channelTotal >= 10) {
                                    channel.subscription10 = true;
                                    channel.subscriptionDate10 = makeDate(year, month, dayData.day);
                                }

                                if(!channel.subscription50 && channel.channelTotal >= 50) {
                                    channel.subscription50 = true;
                                    channel.subscriptionDate50 = makeDate(year, month, dayData.day);
                                }

                                if(!channel.subscription100 && channel.channelTotal >= 100) {
                                    channel.subscription100 = true;
                                    channel.subscriptionDate100 = makeDate(year, month, dayData.day);
                                }

                                if(!channel.subscription250 && channel.channelTotal >= 250) {
                                    channel.subscription250 = true;
                                    channel.subscriptionDate250 = makeDate(year, month, dayData.day);
                                }

                                if(!channel.subscription500 && channel.channelTotal >= 500) {
                                    channel.subscription500 = true;
                                    channel.subscriptionDate500 = makeDate(year, month, dayData.day);
                                }

                                if(!channel.subscription1000 && channel.channelTotal >= 1000) {
                                    channel.subscription1000 = true;
                                    channel.subscriptionDate1000 = makeDate(year, month, dayData.day);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function createSubscriptionChannelData(channelData) {
    return {
        channelId: channelData.channelId,
        channelName: channelData.channelName,
        channelImageUrl: channelData.channelImageUrl,
        channelTotal: 0,
        channelCount1: 0,
        channelCount2: 0,
        subscription1: false,
        subscriptionDate1: null,
        subscription10: false,
        subscriptionDate10: null,
        subscription50: false,
        subscriptionDate50: null,
        subscription100: false,
        subscriptionDate100: null,
        subscription250: false,
        subscriptionDate250: null,
        subscription500: false,
        subscriptionDate500: null,
        subscription1000: false,
        subscriptionDate1000: null,
        yearData: []
    }
}