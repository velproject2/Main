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
            let email = document.getElementById("email").value.trim();
            let driverName = document.getElementById("driverName").value.trim();
            let entry = { apxNumber, modelName, track, trackNumber, driverName, email }; // Removed userName

            if (document.getElementById("checkInDate")) {
                const checkInDate = document.getElementById("checkInDate").value;
                const checkInTime = document.getElementById("checkInTime").value;
                entry.checkInTime = new Date(`${checkInDate}T${checkInTime}`).toLocaleString();
            }

            fetch('https://trackex.onrender.com/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            })
            .then(response => {
                if (!response.ok) throw new Error(response.statusText);
                return response.json();
            })
            .then(data => {
                showPopup("Check-In Successful!");
                checkInForm.reset();
                setTimeout(() => {
                    location.href = `checkout-automate.html?track=${track}&apx=${apxNumber}`;
                }, 3000);
            })
            .catch(error => {
                console.error('Check-In Failed:', error);
                showPopup('Check-In Failed: ' + error.message, 'error');
            });
        });
    }

    if (checkOutForm) {
        checkOutForm.addEventListener("submit", function (e) {
            e.preventDefault();
            let apxNumber = document.getElementById("apxNumber").value.trim();
            let checkOutTime = null;
            if (document.getElementById("checkOutDate")) {
                const checkOutDate = document.getElementById("checkOutDate").value;
                const checkOutTimeValue = document.getElementById("checkOutTime").value;
                checkOutTime = new Date(`${checkOutDate}T${checkOutTimeValue}`).toLocaleString();
            }
            let entry = { apxNumber, checkOutTime }; // Only send necessary fields
    
            fetch('https://trackex.onrender.com/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            })
            .then(response => {
                if (!response.ok) throw new Error(response.statusText);
                return response.json();
            })
            .then(data => {
                showPopup("Check-Out Successful!");
                checkOutForm.reset();
                setTimeout(goBack, 3000);
            })
            .catch(error => {
                console.error('Check-Out Failed:', error);
                showPopup('Check-Out Failed: ' + error.message, 'error');
            });
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

    window.showPopup = function (message, type = 'success') {
        const popup = document.getElementById("popup");
        if (popup) {
            popup.textContent = message;
            popup.style.backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
            popup.style.display = "block";
            setTimeout(() => {
                popup.style.display = "none";
            }, 3000);
        } else {
            console.warn('Popup element not found');
        }
    };

    window.loginToDashboard = function () {
        const password = document.getElementById("dashboardPassword").value;
        if (password === "dashboard123") {
            document.getElementById("loginPrompt").style.display = "none";
            document.getElementById("dashboardContent").style.display = "block";
            displayDashboardEntries();
        } else {
            document.getElementById("loginError").style.display = "block";
        }
    };

    window.displayDashboardEntries = function () {
        fetch('https://trackex.onrender.com/entries')
            .then(response => response.json())
            .then(entries => {
                const dashboardTableBody = document.getElementById("dashboardTableBody");
                if (dashboardTableBody) {
                    dashboardTableBody.innerHTML = "";
                    if (entries.length === 0) {
                        dashboardTableBody.innerHTML = "<tr><td colspan='13'>No entries found</td></tr>";
                    } else {
                        entries.forEach(entry => {
                            let checkInDate = new Date(entry.checkintime);
                            let checkOutDate = entry.checkouttime ? new Date(entry.checkouttime) : null;
                            let hoursUtilized = checkOutDate ? calculateHours(checkInDate, checkOutDate) : 'Not Checked Out';
                            let totalPrice = entry.totalprice !== null ? entry.totalprice.toFixed(2) : "N/A";
    
                            // Store apxNumber and checkInTime in the checkbox value as JSON
                            let row = `<tr>
                                <td><input type="checkbox" class="entryCheckbox" value='${JSON.stringify({ apxNumber: entry.apxnumber, checkInTime: entry.checkintime })}'></td>
                                <td>${entry.apxnumber}</td>
                                <td>${entry.modelname}</td>
                                <td>${entry.track}</td>
                                <td>${entry.tracknumber}</td>
                                <td>${entry.drivername}</td>
                                <td>${entry.email}</td>
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
            .catch(error => {
                console.error('Error fetching entries:', error);
                showPopup('Error fetching entries: ' + error.message, 'error');
            });
    };

    window.toggleSelectAll = function () {
        const selectAll = document.getElementById("selectAll").checked;
        document.querySelectorAll(".entryCheckbox").forEach(checkbox => {
            checkbox.checked = selectAll;
        });
    };

    window.deleteSelected = function () {
        const selected = Array.from(document.querySelectorAll(".entryCheckbox:checked")).map(cb => JSON.parse(cb.value));
        if (selected.length === 0) {
            showPopup("Please select at least one entry to delete.", 'error');
            return;
        }
        if (confirm(`Are you sure you want to delete ${selected.length} entries?`)) {
            fetch('https://trackex.onrender.com/delete-selected', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries: selected }) // Send array of { apxNumber, checkInTime }
            })
            .then(response => {
                if (!response.ok) throw new Error('Deletion failed');
                displayDashboardEntries();
                showPopup("Selected entries deleted!");
            })
            .catch(error => {
                console.error('Error deleting entries:', error);
                showPopup('Error deleting entries: ' + error.message, 'error');
            });
        }
    };

    window.filterEntries = function () {
        const searchValue = document.getElementById("searchApx").value.toLowerCase();
        const filterTime = document.getElementById("filterTime").value;

        fetch('https://trackex.onrender.com/entries')
            .then(response => response.json())
            .then(entries => {
                let filteredEntries = entries.filter(entry => 
                    entry.apxnumber.toLowerCase().includes(searchValue)
                );

                const now = new Date();
                if (filterTime === "month") {
                    filteredEntries = filteredEntries.filter(entry => 
                        new Date(entry.checkintime).getMonth() === now.getMonth() &&
                        new Date(entry.checkintime).getFullYear() === now.getFullYear()
                    );
                } else if (filterTime === "week") {
                    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
                    filteredEntries = filteredEntries.filter(entry => 
                        new Date(entry.checkintime) >= weekAgo
                    );
                } else if (filterTime === "year") {
                    filteredEntries = filteredEntries.filter(entry => 
                        new Date(entry.checkintime).getFullYear() === now.getFullYear()
                    );
                } else if (filterTime === "latest") {
                    filteredEntries.sort((a, b) => new Date(b.checkintime) - new Date(a.checkintime));
                }

                const dashboardTableBody = document.getElementById("dashboardTableBody");
                dashboardTableBody.innerHTML = "";
                if (filteredEntries.length === 0) {
                    dashboardTableBody.innerHTML = "<tr><td colspan='13'>No entries found</td></tr>"; // Adjusted colspan
                } else {
                    filteredEntries.forEach(entry => {
                        let checkInDate = new Date(entry.checkintime);
                        let checkOutDate = entry.checkouttime ? new Date(entry.checkouttime) : null;
                        let hoursUtilized = checkOutDate ? calculateHours(checkInDate, checkOutDate) : 'Not Checked Out';
                        let totalPrice = entry.totalprice !== null ? entry.totalprice.toFixed(2) : "N/A";

                        let row = `<tr>
                            <td><input type="checkbox" class="entryCheckbox" value="${entry.apxnumber}"></td>
                            <td>${entry.apxnumber}</td>
                            <td>${entry.modelname}</td>
                            <td>${entry.track}</td>
                            <td>${entry.tracknumber}</td>
                            <td>${entry.drivername}</td> <!-- Replaced username with drivername -->
                            <td>${entry.email}</td>
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
            })
            .catch(error => {
                console.error('Error filtering entries:', error);
                showPopup('Error filtering entries: ' + error.message, 'error');
            });
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

        fetch('https://trackex.onrender.com/admin/track-prices')
            .then(response => response.json())
            .then(prices => {
                subTrackTable.style.display = "table";
                trackNumbers[track].forEach(subTrack => {
                    const priceObj = prices.find(p => p.track === track && p.subtrack === subTrack);
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
                showPopup("Please enter a valid positive number for the price.", 'error');
                return;
            }

            fetch('https://trackex.onrender.com/admin/track-prices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ track, subTrack, price: priceValue })
            })
            .then(response => response.json())
            .then(data => {
                displaySubTracks();
                showPopup(`Price for ${track} - ${subTrack} updated to ${priceValue}!`);
                if (document.getElementById("dashboardTableBody")) {
                    displayDashboardEntries();
                }
            })
            .catch(error => showPopup('Failed to update price: ' + error.message, 'error'));
        }
    };

    window.setGSTRate = function () {
        const gstRate = prompt("Enter GST rate (%):");
        if (gstRate) {
            fetch('https://trackex.onrender.com/admin/gst-rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gstRate: parseFloat(gstRate) })
            })
            .then(response => response.json())
            .then(() => {
                displayGSTRate();
                showPopup("GST rate updated!");
                if (document.getElementById("dashboardTableBody")) {
                    displayDashboardEntries();
                }
            })
            .catch(error => console.error('Error setting GST rate:', error));
        }
    };

    window.displayGSTRate = function () {
        fetch('https://trackex.onrender.com/admin/gst-rate')
            .then(response => response.json())
            .then(gstRate => {
                document.getElementById("currentGSTRate").textContent = `Current GST Rate: ${gstRate}%`;
            })
            .catch(error => console.error('Error fetching GST rate:', error));
    };

    window.exportToExcel = function () {
        fetch('https://trackex.onrender.com/entries')
            .then(response => response.json())
            .then(entries => {
                if (entries.length === 0) {
                    showPopup("No data to export!", 'error');
                    return;
                }

                let csvContent = "APX Number,Model Name,Track,Track Number,Driver Name,Email,Check-In Date,Check-In Time,Check-Out Date,Check-Out Time,Hours Utilized,Total Price (₹)\n"; // Updated header
                entries.forEach(entry => {
                    let checkInDate = new Date(entry.checkintime);
                    let checkOutDate = entry.checkouttime ? new Date(entry.checkouttime) : null;
                    let hoursUtilized = checkOutDate ? calculateHours(checkInDate, checkOutDate) : 'Not Checked Out';
                    let totalPrice = entry.totalprice !== null ? entry.totalprice.toFixed(2) : "N/A";

                    csvContent += `${entry.apxnumber},${entry.modelname},${entry.track},${entry.tracknumber},${entry.drivername},${entry.email},${checkInDate.toLocaleDateString()},${checkInDate.toLocaleTimeString()},${checkOutDate ? checkOutDate.toLocaleDateString() : 'Not Checked Out'},${checkOutDate ? checkOutDate.toLocaleTimeString() : 'Not Checked Out'},${hoursUtilized},${totalPrice}\n`;
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
            fetch('https://trackex.onrender.com/entries', { method: 'DELETE' })
                .then(response => {
                    if (response.status === 204) return null;
                    return response.json();
                })
                .then(() => {
                    displayDashboardEntries();
                    showPopup("All entries cleared!");
                })
                .catch(error => {
                    console.error('Error clearing entries:', error);
                    showPopup('Error clearing entries: ' + error.message, 'error');
                });
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
        // Display login prompt initially
    }
});