document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const resultsDiv = document.getElementById('results');

    const keyMap = {
        "HG_NM": "한글 이름",
        "HJ_NM": "한자 이름",
        "ENG_NM": "영문 이름",
        "BTH_GBN_NM": "음력/양력",
        "BTH_DATE": "생년월일",
        "POLY_NM": "정당명",
        "ORIG_NM": "선거구",
        "CMIT_NM": "대표 위원회",
        "REELE_GBN_NM": "재선 횟수",
        "UNITS": "당선 횟수",
        "CMITS": "소속 위원회 목록",
        "SEX_GBN_NM": "성별",
        "TEL_NO": "전화번호",
        "ASSEM_ADDR": "사무실 호실",
        "E_MAIL": "이메일",
        "HOMEPAGE": "홈페이지",
        "STAFF": "보좌관",
        "SECRETARY": "선임비서관",
        "SECRETARY2": "비서관",
        "STATUS_CD": "재직 구분"
    };

    let politiciansData = []; // To store the parsed data from data.json

    // Helper functions for memo storage
    function saveMemo(id, memo) {
        localStorage.setItem(`memo-${id}`, memo);
        console.log(`Memo for ${id} saved.`);
    }

    function loadMemo(id) {
        return localStorage.getItem(`memo-${id}`) || '';
    }

    // Function to fetch data.json
    async function fetchData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const rawData = await response.json();
            
            // Assuming the first element is a header/description and actual data starts from the second element.
            if (Array.isArray(rawData) && rawData.length > 0 && rawData[0].hasOwnProperty("HG_NM") && rawData[0]["HG_NM"] === "이름") {
                politiciansData = rawData.slice(1); // Skip the header row
            } else {
                politiciansData = rawData; // Assume all are data if no header is detected or structure is different
            }
            console.log('Data loaded successfully:', politiciansData.length, 'records');
        } catch (error) {
            resultsDiv.innerHTML = `<p class="error-message">데이터를 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
            console.error('Error fetching data:', error);
        }
    }

    // Function to perform the search
    function performSearch() {
        const nameToSearch = searchInput.value.toLowerCase().trim();
        resultsDiv.innerHTML = ''; // Clear previous results

        if (!nameToSearch) {
            resultsDiv.innerHTML = '<p class="error-message">검색할 이름을 입력해주세요.</p>';
            return;
        }

        const results = [];
        
        for (const politician of politiciansData) {
            let matchType = '';
            let matchedStaffName = '';

            // Search in HG_NM (의원 이름)
            if (politician.HG_NM && politician.HG_NM.toLowerCase().includes(nameToSearch)) {
                matchType = '의원';
            }

            // Search in STAFF (보좌관)
            if (politician.STAFF) {
                const staffMembers = politician.STAFF.split(',').map(s => s.trim());
                for (const staff of staffMembers) {
                    if (staff.toLowerCase().includes(nameToSearch)) {
                        matchType = '보좌관';
                        matchedStaffName = staff;
                        break;
                    }
                }
            }

            // Search in SECRETARY (선임비서관)
            if (politician.SECRETARY && !matchType) {
                const secretaries = politician.SECRETARY.split(',').map(s => s.trim());
                for (const sec of secretaries) {
                    if (sec.toLowerCase().includes(nameToSearch)) {
                        matchType = '선임비서관';
                        matchedStaffName = sec;
                        break;
                    }
                }
            }

            // Search in SECRETARY2 (비서관)
            if (politician.SECRETARY2 && !matchType) {
                const secretaries2 = politician.SECRETARY2.split(',').map(s => s.trim());
                for (const sec2 of secretaries2) {
                    if (sec2.toLowerCase().includes(nameToSearch)) {
                        matchType = '비서관';
                        matchedStaffName = sec2;
                        break;
                    }
                }
            }
            
            if (matchType) {
                results.push({politician, matchType, matchedStaffName});
            }
        }

        if (results.length > 0) {
            let resultsHtml = `<p>'${searchInput.value}'(으)로 검색된 결과:</p>`;
            results.forEach((item, index) => {
                const {politician, matchType, matchedStaffName} = item;
                resultsHtml += `<div class="result-item">`;
                
                if (matchType === '의원') {
                    resultsHtml += `<h3>${searchInput.value} 님은 의원입니다.</h3>`;
                } else {
                    resultsHtml += `<h3>'${matchedStaffName}' 님은 '${politician.HG_NM}' 의원실의 ${matchType}입니다.</h3>`;
                }

                for (const key in politician) {
                    if (key === 'STATUS_CD') continue; // Skip STATUS_CD

                    const displayKey = keyMap[key] || key; // Use Korean name from map, or original key if not found
                    if (politician[key] !== null && politician[key] !== '' && String(politician[key]).toLowerCase() !== 'null') {
                        resultsHtml += `<p><strong>${displayKey}</strong>: ${politician[key]}</p>`;
                    }
                }

                // Add memo feature for staff members
                if (matchType !== '의원') {
                    const memoId = `${politician.HG_NM}-${matchedStaffName}`; // Unique ID for memo
                    const existingMemo = loadMemo(memoId);
                    resultsHtml += `
                        <div class="memo-section">
                            <h4>메모</h4>
                            <textarea class="memo-textarea" id="memo-${memoId}" rows="3" placeholder="메모를 입력하세요">${existingMemo}</textarea>
                            <button class="save-memo-btn" data-memo-id="${memoId}">메모 저장</button>
                        </div>
                    `;
                }
                resultsHtml += `</div>`;
            });
            resultsDiv.innerHTML = resultsHtml;

            // Add event listeners for memo save buttons
            document.querySelectorAll('.save-memo-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const memoId = event.target.dataset.memoId;
                    const memoText = document.getElementById(`memo-${memoId}`).value;
                    saveMemo(memoId, memoText);
                    alert('메모가 저장되었습니다!');
                });
            });
        } else {
            resultsDiv.innerHTML = `<p class="error-message">'${searchInput.value}'(으)로 검색된 정보가 없습니다.</p>`;
        }
    }

    // Event Listeners
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // Initial data fetch when the page loads
    fetchData();
});