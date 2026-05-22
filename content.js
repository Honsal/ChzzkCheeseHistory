(async () => {
    let viewHtml = `
    <button id="closeModalBtn">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M6 6L18 18" />
            <path d="M18 6L6 18" />
        </svg>
    </button>

    <div class="cch_content">
        <div class="cch_form_wrapper mb10">
            <div class="cch_tab_container_mode">
                <ul class="cch_tab_list_mode">
                    <li class="cch_tab_item">
                        <button class="cch_tab_button on" id="cheeseTab" onclick="chgTab('CHEESE');">
                            치즈
                        </button>
                    </li>
                    <li class="cch_tab_item">
                        <button class="cch_tab_button" id="subscriptionTab" onclick="chgTab('SUBSCRIPTION');">
                            구독선물
                        </button>
                    </li>
                </ul>
            </div>
        </div>

        <div class="cch_innerLayout">
            <div class="history">
                <div class="cch_form_wrapper" id="channelHistoryWrap">
                    <div class="cch_tab_container">
                        <ul class="cch_tab_list">
                            <li class="cch_tab_item">
                                <button class="cch_tab_button on" id="channelBtn" onclick="chgView('Channel');">
                                    <span class="cch_tab_box">
                                        <span class="cch_tab_text">채널</span>
                                    </span>
                                </button>
                            </li>
                            <li class="cch_tab_item">
                                <button class="cch_tab_button" id="graphBtn" onclick="chgView('Graph');">
                                    <span class="cch_tab_box">
                                        <span class="cch_tab_text">그래프</span>
                                    </span>
                                </button>
                            </li>
                            <li class="cch_tab_item">
                                <button class="cch_tab_button" id="calendarBtn" onclick="chgView('Calendar');">
                                    <span class="cch_tab_box">
                                        <span class="cch_tab_text">달력</span>
                                    </span>
                                </button>
                            </li>
                        </ul>
                        <div class="cch_selectbox" data-visible="none">
                            <div class="cch_selectbox_container">
                                <button class="cch_selectbox_component" data-key="calendar_year">
                                    <span class="cch_selectbox_inner"></span>
                                </button>
                                <ul class="cch_selectbox_layer calendar_year_selectbox" data-visible="none"></ul>
                            </div>
                            <div class="cch_selectbox_container">
                                <button class="cch_selectbox_component" data-key="calendar_month">
                                    <span class="cch_selectbox_inner"></span>
                                </button>
                                <ul class="cch_selectbox_layer calendar_month_selectbox" data-visible="none"></ul>
                            </div>
                            <button type="button" id="button" class="cch_button_container" onclick="rendarCalendar();" style="margin-left: 0px;">
                                <span class="button_inner">조회</span>
                            </button>
                        </div>
                    </div>

                    <div class="cch_channelList" data-visible="block">
                        <div id="totalContainer" data-visible="flex">
                            <h3 id="totalPayAmount">조회중</h3>
                            <div class="radio-box" onchange="changeSortType();">
                                <input type="radio" id="sortTotal" name="sortType" value="total" checked="checked"><label for="sortTotal">후원금액순</label>
                                <input type="radio" id="sortName" name="sortType" value="name"><label for="sortName">닉네임순</label>
                            </div>
                        </div>
                        <div id="channelListContainer"></div>
                    </div>

                    <div id="channelHistory" data-visible="none">
                        <h3 id="channelInfo"></h3>
                        <ul id="channelInfoYear"></ul>
                        <canvas id="monthlyChart"></canvas>
                    </div>

                    <div id="channelHistoryCalendar" data-visible="none">
                        <ul id="channelHistoryCalendarUl">
                            <li id="channelHistoryCalendarheaderLi">
                                <div class="calendar_month_total"></div>
                                <div class="calendar_header">
                                    <button class="cch_button_container_fit" onclick="goPrev();">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M15 5L8 12L15 19" />
                                        </svg>
                                    </button>
                                    <h2 class="calendarDate">----년 -월</h2>
                                    <button class="cch_button_container_fit" onclick="goNext();">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M9 5L16 12L9 19" />
                                        </svg>
                                    </button>
                                </div>
                                <div class="cheese_history"></div>
                            </li>
                            <li>
                                <div class="calendar_container">
                                    <table class="calendar">
                                        <thead class="days">
                                            <tr>
                                                <th class="day"><h4>SUN</h4></th>
                                                <th class="day"><h4>MON</h4></th>
                                                <th class="day"><h4>TUE</h4></th>
                                                <th class="day"><h4>WED</h4></th>
                                                <th class="day"><h4>THU</h4></th>
                                                <th class="day"><h4>FRI</h4></th>
                                                <th class="day"><h4>SAT</h4></th>
                                            </tr>
                                        </thead>
                                        <tbody class="dates"></tbody>
                                    </table>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    if(window.location.hostname === "chzzk.naver.com" || window.location.hostname === "game.naver.com") {
        if(document.getElementById("cheeseHistoryModal")) return;
    
        if(!document.getElementById("cch-style")) {
            const link = document.createElement("link");
            link.id = "cch-style";
            link.rel = "stylesheet";
            link.href = chrome.runtime.getURL("css/chzzkCheeseHistory.css");
            document.head.appendChild(link);
        }

        const modal = document.createElement("div");
        modal.id = "cheeseHistoryModal";
        modal.innerHTML = viewHtml;
        document.body.appendChild(modal);
    
        if(!document.getElementById("cch-chart-script")) {
            await new Promise((resolve) => {
                const script = document.createElement("script");
                script.id = "cch-chart-script";
                script.src = chrome.runtime.getURL("libs/chart.umd.js");
                script.onload = resolve;
                document.body.appendChild(script);
            });
        }

        const oldCheeseScript = document.getElementById("cch-cheese-script");
        if(oldCheeseScript) {
            oldCheeseScript.remove();
        }

        await new Promise((resolve) => {
            const script = document.createElement("script");
            script.id = "cch-cheese-script";
            script.src = chrome.runtime.getURL("js/cheeseHistory.js");
            script.onload = resolve;
            document.body.appendChild(script);
        });
    
        const oldSubscriptionScript = document.getElementById("cch-subscription-script");
        if(oldSubscriptionScript) {
            oldSubscriptionScript.remove();
        }
    
        await new Promise((resolve) => {
            const script = document.createElement("script");
            script.id = "cch-subscription-script";
            script.src = chrome.runtime.getURL("js/subscriptionHistory.js");
            script.onload = resolve;
            document.body.appendChild(script);
        });
    
        const oldUtilScript = document.getElementById("cch-util-script");
        if(oldUtilScript) {
            oldUtilScript.remove();
        }
    
        await new Promise((resolve) => {
            const script = document.createElement("script");
            script.id = "cch-util-script";
            script.src = chrome.runtime.getURL("js/util.js");
            script.onload = resolve;
            document.body.appendChild(script);
        });
    } else {
        alert("치지직, 네이버 게임 프로필 화면에서만 조회 가능합니다.");
        return;
    }
})();

