document.addEventListener("DOMContentLoaded", function () {
    const trackNumbers = {
        "GARC": ["G1", "G2", "G3", "G4"],
        "WABCO": ["W1", "W2", "W3"],
        "NATRAX": ["T1 (High Speed Track)", "T2 (Dynamic Platform)", "T3 (Braking Track - Dry)", "T3 (Braking Track - Wet)", "T4 (Test Hill / Gradient)", "T5a (Fatigue Track - 0.5m)", "T5a (Fatigue Track - 1.0m)", "T13 (Noise Track)"],
        "NCAT": ["NC1", "NC2"],
        "MSPT": ["M1", "M2", "M3"]
    };

    const urlParams = new URLSearchParams(window.location.search);
    const track = urlParams.get('track');
    const trackNumberSelect = document.getElementById("trackNumber");

    if (track && trackNumberSelect) {
        document.getElementById('trackHeading').textContent = `${track} - ${document.title}`;
        trackNumberSelect.innerHTML = '<option value="">--Select Track Number--</option>';
        trackNumbers[track].forEach(num => {
            let option = document.createElement("option");
            option.value = num;
            option.textContent = num;
            trackNumberSelect.appendChild(option);
        });
    }

    const checkInForm = document.getElementById("checkInForm");
    const checkOutForm = document.getElementById("checkOutForm");

    if (checkInForm) {
        checkInForm.addEventListener("submit", function (e) {
            e.preventDefault();
            let apxNumber = document.getElementById("apxNumber").value.trim();
            let modelName = document.getElementById("modelName").value.trim();
            let trackNumber = document.getElementById("trackNumber").value;
            let userName = document.getElementById("userName").value.trim();
            let entry = { apxNumber, modelName, track, trackNumber, userName };

            if (document.getElementById("checkInDate")) {
                const checkInDate = document.getElementById("checkInDate").value;
                const checkInTime = document.getElementById("checkInTime").value;
                entry.checkInTime = new Date(`${checkInDate}T${checkInTime}`).toLocaleString();
            }

            fetch('http://localhost:5000/api/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            })
            .then(response => response.json())
            .then(data => {
                alert("Check-In Successful!");
                checkInForm.reset();
                if (window.location.pathname.includes("checkin-automate.html")) {
                    location.href = `checkout-automate.html?track=${track}&apx=${apxNumber}`;
                } else {
                    goBack();
                }
            })
            .catch(error => alert('Check-In Failed: ' + error.message));
        });
    }

    if (checkOutForm) {
        checkOutForm.addEventListener("submit", function (e) {
            e.preventDefault();
            let apxNumber = document.getElementById("apxNumber").value.trim();
            let modelName = document.getElementById("modelName").value.trim();
            let trackNumber = document.getElementById("trackNumber").value;
            let userName = document.getElementById("userName").value.trim();
            let entry = { apxNumber, modelName, track, trackNumber, userName };

            if (document.getElementById("checkOutDate")) {
                const checkOutDate = document.getElementById("checkOutDate").value;
                const checkOutTime = document.getElementById("checkOutTime").value;
                entry.checkOutTime = new Date(`${checkOutDate}T${checkOutTime}`).toLocaleString();
            }

            fetch('http://localhost:5000/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            })
            .then(response => response.json())
            .then(data => {
                alert("Check-Out Successful!");
                checkOutForm.reset();
                goBack();
            })
            .catch(error => alert('Check-Out Failed: ' + error.message));
        });

        if (window.location.pathname.includes("checkout-automate.html")) {
            const apxNumber = urlParams.get('apx');
            if (apxNumber) {
                document.getElementById("apxNumber").value = apxNumber;
            }
        }
    }

    window.goBack = function () {
        location.href = `track-page.html?track=${track}`;
    };

    window.displayDashboardEntries = function () {
        fetch('http://localhost:5000/api/entries')
            .then(response => response.json())
            .then(entries => {
                const dashboardTableBody = document.getElementById("dashboardTableBody");
                if (dashboardTableBody) {
                    dashboardTableBody.innerHTML = "";
                    if (entries.length === 0) {
                        dashboardTableBody.innerHTML = "<tr><td colspan='11'>No entries found</td></tr>";
                    } else {
                        entries.forEach(entry => {
                            let checkInDate = new Date(entry.checkInTime);
                            let checkOutDate = entry.checkOutTime ? new Date(entry.checkOutTime) : null;
                            let hoursUtilized = checkOutDate ? calculateHours(checkInDate, checkOutDate) : 'Not Checked Out';
                            let totalPrice = entry.totalPrice !== null ? entry.totalPrice.toFixed(2) : "N/A";

                            let row = `<tr>
                                <td>${entry.apxNumber}</td>
                                <td>${entry.modelName}</td>
                                <td>${entry.track}</td>
                                <td>${entry.trackNumber}</td>
                                <td>${entry.userName}</td>
                                <td>${checkInDate.toLocaleDateString()}</td>
                                <td>${checkInDate.toLocaleTimeString()}</td>
                                <td>${checkOutDate ? checkOutDate.toLocaleDateString() : 'Not Checked Out'}</td>
                                <td>${checkOutDate ? checkOutDate.toLocaleTimeString() : 'Not Checked Out'}</td>
                                <td>${hoursUtilized}</td>
                                <td>${totalPrice}</td>
                            </tr>`;
                            dashboardTableBody.innerHTML += row;
                        });
                    }
                }
            })
            .catch(error => console.error('Error fetching entries:', error));
    };

    window.login = function () {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        if (username === "admin" && password === "admin") {
            document.getElementById("loginForm").style.display = "none";
            document.getElementById("adminDashboard").style.display = "block";
            displayGSTRate();
            displaySubTracks();
        } else {
            document.getElementById("loginError").style.display = "block";
        }
    };

    window.displaySubTracks = function () {
        const track = document.getElementById("trackSelect").value;
        const subTrackTable = document.getElementById("subTrackTable");
        const subTrackTableBody = document.getElementById("subTrackTableBody");
        subTrackTableBody.innerHTML = "";

        if (!track) {
            subTrackTable.style.display = "none";
            return;
        }

        fetch('http://localhost:5000/api/admin/track-prices')
            .then(response => response.json())
            .then(prices => {
                subTrackTable.style.display = "table";
                trackNumbers[track].forEach(subTrack => {
                    const priceObj = prices.find(p => p.track === track && p.subTrack === subTrack);
                    const price = priceObj ? priceObj.price : "Not Set";
                    const row = `<tr>
                        <td>${subTrack}</td>
                        <td>${price}</td>
                        <td><button class="update-btn" onclick="updateTrackPrice('${track}', '${subTrack}')">Update</button></td>
                    </tr>`;
                    subTrackTableBody.innerHTML += row;
                });
            })
            .catch(error => console.error('Error fetching track prices:', error));
    };

    window.updateTrackPrice = function (track, subTrack) {
        const price = prompt(`Enter price for ${track} - ${subTrack}:`);
        if (price !== null && price !== "") {
            const priceValue = parseFloat(price);
            if (isNaN(priceValue) || priceValue < 0) {
                alert("Please enter a valid positive number for the price.");
                return;
            }

            console.log(`Updating price for ${track} - ${subTrack} to ${priceValue}`);
            fetch('http://localhost:5000/api/admin/track-prices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ track, subTrack, price: priceValue })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Price update response:', data);
                displaySubTracks(); // Refresh admin view
                alert(`Price for ${track} - ${subTrack} updated to ${priceValue}!`);
                if (document.getElementById("dashboardTableBody")) {
                    displayDashboardEntries(); // Refresh dashboard if open
                }
            })
            .catch(error => {
                console.error('Error updating track price:', error);
                alert('Failed to update price: ' + error.message);
            });
        }
    };

    window.setGSTRate = function () {
        const gstRate = prompt("Enter GST rate (%):");
        if (gstRate) {
            fetch('http://localhost:5000/api/admin/gst-rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gstRate: parseFloat(gstRate) })
            })
            .then(response => response.json())
            .then(() => {
                displayGSTRate();
                alert("GST rate updated!");
                if (document.getElementById("dashboardTableBody")) {
                    displayDashboardEntries();
                }
            })
            .catch(error => console.error('Error setting GST rate:', error));
        }
    };

    window.displayGSTRate = function () {
        fetch('http://localhost:5000/api/admin/gst-rate')
            .then(response => response.json())
            .then(gstRate => {
                document.getElementById("currentGSTRate").textContent = `Current GST Rate: ${gstRate}%`;
            })
            .catch(error => console.error('Error fetching GST rate:', error));
    };

    window.exportToExcel = function () {
        fetch('http://localhost:5000/api/entries')
            .then(response => response.json())
            .then(entries => {
                if (entries.length === 0) {
                    alert("No data to export!");
                    return;
                }

                let csvContent = "APX Number,Model Name,Track,Track Number,User,Check-In Date,Check-In Time,Check-Out Date,Check-Out Time,Hours Utilized,Total Price (₹)\n";
                entries.forEach(entry => {
                    let checkInDate = new Date(entry.checkInTime);
                    let checkOutDate = entry.checkOutTime ? new Date(entry.checkOutTime) : null;
                    let hoursUtilized = checkOutDate ? calculateHours(checkInDate, checkOutDate) : 'Not Checked Out';
                    let totalPrice = entry.totalPrice !== null ? entry.totalPrice.toFixed(2) : "N/A";

                    csvContent += `${entry.apxNumber},${entry.modelName},${entry.track},${entry.trackNumber},${entry.userName},${checkInDate.toLocaleDateString()},${checkInDate.toLocaleTimeString()},${checkOutDate ? checkOutDate.toLocaleDateString() : 'Not Checked Out'},${checkOutDate ? checkOutDate.toLocaleTimeString() : 'Not Checked Out'},${hoursUtilized},${totalPrice}\n`;
                });

                let blob = new Blob([csvContent], { type: "text/csv" });
                let link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "track_entries.csv";
                link.click();
            })
            .catch(error => console.error('Error exporting to Excel:', error));
    };

    window.clearEntries = function () {
        if (confirm("Are you sure you want to clear all entries? This action cannot be undone.")) {
            fetch('http://localhost:5000/api/entries', { method: 'DELETE' })
                .then(response => {
                    if (response.status === 204) return null;
                    return response.json();
                })
                .then(() => {
                    displayDashboardEntries();
                    alert("All entries cleared!");
                })
                .catch(error => console.error('Error clearing entries:', error));
        }
    };

    function calculateHours(start, end) {
        let diff = Math.abs(new Date(end) - new Date(start));
        let hours = Math.floor(diff / 3600000);
        let minutes = Math.floor((diff % 3600000) / 60000);
        let seconds = Math.floor((diff % 60000) / 1000);
        return `${hours}:${minutes}:${seconds}`;
    }

    if (window.location.pathname.includes("dashboard.html")) {
        displayDashboardEntries();
    }
});