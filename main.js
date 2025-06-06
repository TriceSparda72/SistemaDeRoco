// Botón para abrir/cerrar el menú lateral (solo para páginas con menú)
document.getElementById("toggleMenu")?.addEventListener("click", function () {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("active");
});

// Alternar visibilidad de submenús
function toggleSubMenu(submenuId) {
    const submenu = document.getElementById(submenuId);
    submenu.style.display = submenu.style.display === "block" ? "none" : "block";
}

// Variables globales para paginación
let currentMonth = new Date().getMonth(); // Mes actual
let currentYear = new Date().getFullYear(); // Año actual

// Datos iniciales del sistema, con soporte para persistencia en localStorage
let inventory = JSON.parse(localStorage.getItem("inventory")) || []; // Lista de clientes
let generalHistory = JSON.parse(localStorage.getItem("generalHistory")) || []; // Historial general
let expenses = JSON.parse(localStorage.getItem("expenses")) || []; // Egresos registrados

// Guardar datos en localStorage
function saveInventory() {
    localStorage.setItem("inventory", JSON.stringify(inventory));
}

function saveGeneralHistory() {
    localStorage.setItem("generalHistory", JSON.stringify(generalHistory));
}

function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

// Cargar dinámicamente clientes en el submenú de inventario
function populateSubMenu() {
    const inventarioSubmenu = document.getElementById("inventarioSubmenu");
    if (!inventarioSubmenu) return;

    inventarioSubmenu.innerHTML = ""; // Limpiar contenido previo

    inventory.forEach((local) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `<a href="client-details.html?localName=${encodeURIComponent(local.localName)}">${local.localName}</a>`;
        inventarioSubmenu.appendChild(listItem);
    });
}

// Actualizar lista de locales en formularios
function populateDeliveryOptions() {
    const localNameSelect = document.getElementById("localName");
    if (!localNameSelect) return;

    localNameSelect.innerHTML = `<option value="" disabled selected>Selecciona un Local</option>`;
    inventory.forEach((local) => {
        const option = document.createElement("option");
        option.value = local.localName;
        option.textContent = local.localName;
        localNameSelect.appendChild(option);
    });
}

function populateUpdateLocalOptions() {
    const updateLocalSelect = document.getElementById("updateLocal");
    if (!updateLocalSelect) return;

    updateLocalSelect.innerHTML = `<option value="" disabled selected>Selecciona un Local</option>`;
    inventory.forEach((local) => {
        const option = document.createElement("option");
        option.value = local.localName;
        option.textContent = local.localName;
        updateLocalSelect.appendChild(option);
    });
}
// Registrar un nuevo cliente
document.getElementById("registerLocalForm")?.addEventListener("submit", function (event) {
    event.preventDefault();

    const localName = document.getElementById("localName").value;
    const localAddress = document.getElementById("localAddress").value;
    const localEmail = document.getElementById("localEmail")?.value || null;
    const initialStock = parseInt(document.getElementById("botellones").value, 10);
    const productType = document.getElementById("productType")?.value || "agua";
    const waterPrice = parseFloat(document.getElementById("waterPrice")?.value) || 0;
    const icePrice = parseFloat(document.getElementById("icePrice")?.value) || 0;

    if (isNaN(initialStock) || initialStock < 0) {
        alert("Por favor, ingrese un número válido para los botellones.");
        return;
    }

    inventory.push({
        localName,
        address: localAddress,
        email: localEmail,
        stock: initialStock,
        localStock: 0,
        warehouseStock: initialStock,
        productType,
        waterPrice,
        icePrice,
        history: [],
        debt: 0,
        dueDate: null,
    });

    saveInventory();
    populateSubMenu();
    populateUpdateLocalOptions();
    alert(`Cliente "${localName}" registrado exitosamente con ${initialStock} botellones.`);
    document.getElementById("registerLocalForm").reset();
});

// Cargar clientes como recuadros en inventory.html
function loadInventoryGrid() {
    const inventoryGrid = document.getElementById("inventoryGrid");
    if (!inventoryGrid) return;

    inventoryGrid.innerHTML = "";

    inventory.forEach((local, index) => {
        const clientCard = document.createElement("div");
        clientCard.className = "grid-item";
        clientCard.innerHTML = `
            <h3>${local.localName}</h3>
            <p>Dirección: ${local.address}</p>
            <p>Correo: ${local.email || "No especificado"}</p>
            <p>Stock Disponible: ${local.stock}</p>
            <button onclick="location.href='client-details.html?localName=${encodeURIComponent(local.localName)}'">Ver Detalles</button>
            <button class="delete-button" onclick="deleteClient(${index})">Eliminar</button>
        `;
        inventoryGrid.appendChild(clientCard);
    });
}

// Función para eliminar un cliente del inventario
function deleteClient(index) {
    const confirmation = confirm("¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.");
    if (confirmation) {
        inventory.splice(index, 1);
        saveInventory();
        alert("Cliente eliminado exitosamente.");
        loadInventoryGrid();
    }
}
// Registrar entregas y recogidas
document.getElementById("deliveryForm")?.addEventListener("submit", function (event) {
    event.preventDefault();

    const localName = document.getElementById("localName").value;
    const productType = document.getElementById("productType")?.value || "agua";
    const quantity = parseInt(document.getElementById("quantity").value, 10);
    const transactionType = document.getElementById("transactionType").value;

    const local = inventory.find((item) => item.localName === localName);
    if (!local) {
        alert("Local no encontrado en el inventario.");
        return;
    }

    if (local.localStock === undefined) local.localStock = 0;
    if (local.warehouseStock === undefined) local.warehouseStock = local.stock;

    if (transactionType === "Entrega") {
        const pricePerUnit = productType === "agua" ? local.waterPrice : local.icePrice;
        const totalPrice = pricePerUnit * quantity;

        local.localStock -= quantity;
        local.warehouseStock += quantity;

        const transaction = {
            date: new Date().toLocaleDateString(),
            product: productType,
            quantity,
            transactionType,
            totalPrice: `$${totalPrice.toFixed(2)}`,
        };
        local.history.push(transaction);
        generalHistory.push({ ...transaction, localName: local.localName });
        saveGeneralHistory();
    } else if (transactionType === "Recogida") {
        if (local.warehouseStock < quantity) {
            alert("No hay suficiente stock en el almacén para realizar la recogida.");
            return;
        }
        local.localStock += quantity;
        local.warehouseStock -= quantity;

        const transaction = {
            date: new Date().toLocaleDateString(),
            product: productType,
            quantity,
            transactionType,
        };
        local.history.push(transaction);
        generalHistory.push({ ...transaction, localName: local.localName });
        saveGeneralHistory();
    }

    saveInventory();
    alert(`${transactionType} registrada exitosamente para ${localName}.`);
    document.getElementById("deliveryForm").reset();

    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage === "client-details.html") {
        updateLocalAndWarehouseTable(local.localStock, local.warehouseStock);
    }
});
// Filtrar historial por mes y año
function getTransactionsByMonth(year, month) {
    return generalHistory.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
    });
}
function loadHistoryByMonth(year, month) {
    const historyTableBody = document.getElementById("historyTableBody");
    if (!historyTableBody) return;

    historyTableBody.innerHTML = ""; // Limpiar contenido previo

    const transactions = getTransactionsByMonth(year, month);
    if (transactions.length === 0) {
        historyTableBody.innerHTML = `<tr><td colspan="6">No hay transacciones registradas para este mes.</td></tr>`;
        return;
    }

    transactions.forEach((transaction) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.localName}</td>
            <td>${transaction.product}</td>
            <td>${transaction.quantity}</td>
            <td>${transaction.transactionType}</td>
            <td>${transaction.totalPrice || "N/A"}</td>
        `;
        historyTableBody.appendChild(row);
    });
}
function changeMonth(direction) {
    if (direction === "next") {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0; // Volver a enero
            currentYear++; // Cambiar al año siguiente
        }
    } else if (direction === "previous") {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11; // Volver a diciembre
            currentYear--; // Cambiar al año anterior
        }
    }

    loadHistoryByMonth(currentYear, currentMonth); // Cargar datos del nuevo mes
}
function exportHistoryToPDF(year, month) {
    const transactions = getTransactionsByMonth(year, month);
    if (transactions.length === 0) {
        alert("No hay transacciones registradas para exportar.");
        return;
    }

    const pdf = new jsPDF();
    pdf.setFontSize(12);
    pdf.text(`Historial de Transacciones: ${month + 1}/${year}`, 10, 10);

    let yPosition = 20; // Posición inicial para los datos
    transactions.forEach((transaction) => {
        const transactionDetails = `
            Fecha: ${transaction.date}, Cliente: ${transaction.localName}, Producto: ${transaction.product},
            Cantidad: ${transaction.quantity}, Transacción: ${transaction.transactionType}, Total: ${transaction.totalPrice || "N/A"}
        `;
        pdf.text(transactionDetails, 10, yPosition);
        yPosition += 10;
    });

    pdf.save(`Historial_${month + 1}_${year}.pdf`);
}
window.onload = function () {
    const currentPage = window.location.pathname.split("/").pop();

    if (currentPage === "history.html") {
        loadHistoryByMonth(currentYear, currentMonth); // Cargar historial paginado
    } else if (currentPage === "register-local.html") {
        populateSubMenu();
        populateUpdateLocalOptions();
    } else if (currentPage === "inventory.html") {
        loadInventoryGrid();
    } else if (currentPage === "sales-report.html") {
        loadSalesReport();
    } else if (currentPage === "treasury.html") {
        loadTreasuryIncome();
        loadTreasuryExpenses();
    } else if (currentPage === "debtors.html") {
        loadDebtors();
    } else if (currentPage === "delivery.html" || currentPage === "deliveries.html") {
        populateDeliveryOptions();
    } else if (currentPage === "client-details.html") {
        loadClientDetails();
    }
};
// Cargar ingresos en la tabla de Tesorería
function loadTreasuryIncome() {
    const incomeTableBody = document.getElementById("treasuryIncomeTableBody");
    if (!incomeTableBody) return;

    // Limpiar contenido previo
    incomeTableBody.innerHTML = "";

    // Filtrar transacciones de tipo "Entrega"
    const incomes = generalHistory.filter((transaction) => transaction.transactionType === "Entrega");
    if (incomes.length === 0) {
        incomeTableBody.innerHTML = `<tr><td colspan="3">No hay ingresos registrados.</td></tr>`;
        return;
    }

    // Iterar sobre ingresos para llenar la tabla
    incomes.forEach((income) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${income.date}</td>
            <td>${income.localName}</td>
            <td>${income.totalPrice || "$0.00"}</td>
        `;
        incomeTableBody.appendChild(row);
    });
}
// Cargar egresos en la tabla de Tesorería
function loadTreasuryExpenses() {
    const expensesTableBody = document.getElementById("treasuryExpensesTableBody");
    if (!expensesTableBody) return;

    // Limpiar contenido previo
    expensesTableBody.innerHTML = "";

    // Verificar si hay egresos registrados
    if (expenses.length === 0) {
        expensesTableBody.innerHTML = `<tr><td colspan="3">No hay egresos registrados.</td></tr>`;
        return;
    }

    // Iterar sobre egresos para llenar la tabla
    expenses.forEach((expense) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${expense.description}</td>
            <td>${expense.date}</td>
            <td>${expense.amount}</td>
        `;
        expensesTableBody.appendChild(row);
    });
}
// Registrar nuevos egresos en la Tesorería
function addTreasuryExpense(description, amount) {
    const expense = {
        description: description,
        date: new Date().toLocaleDateString(),
        amount: `$${parseFloat(amount).toFixed(2)}`,
    };

    expenses.push(expense); // Agregar gasto
    saveExpenses(); // Guardar en localStorage

    alert("Egreso registrado exitosamente.");
    loadTreasuryExpenses(); // Actualizar tabla de egresos
}
// Cargar deudores en la tabla de Deudores
function loadDebtors() {
    const debtorsTableBody = document.getElementById("debtorsTableBody");
    if (!debtorsTableBody) return;

    // Limpiar contenido previo
    debtorsTableBody.innerHTML = "";

    // Filtrar clientes con deuda pendiente
    const debtors = inventory.filter((client) => client.debt && client.debt > 0);

    if (debtors.length === 0) {
        debtorsTableBody.innerHTML = `<tr><td colspan="4">No hay clientes con cuentas pendientes.</td></tr>`;
        return;
    }

    // Iterar sobre deudores para llenar la tabla
    debtors.forEach((client) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${client.localName}</td>
            <td>${client.productType}</td>
            <td>$${client.debt.toFixed(2)}</td>
            <td>${client.dueDate || "Sin fecha de vencimiento"}</td>
        `;
        debtorsTableBody.appendChild(row);
    });
}
// Registrar o actualizar cuentas pendientes para un cliente
function updateClientDebt(clientName, amount, dueDate) {
    const client = inventory.find((item) => item.localName === clientName);
    if (!client) {
        alert("Cliente no encontrado en el inventario.");
        return;
    }

    // Actualizar deuda y fecha de vencimiento
    client.debt = parseFloat(amount) || 0;
    client.dueDate = dueDate || null;

    saveInventory(); // Guardar cambios
    alert(`La deuda para "${clientName}" ha sido actualizada a $${client.debt.toFixed(2)}.`);
    loadDebtors(); // Actualizar tabla de deudores
}
// Inicializar sistema al cargar la página
window.onload = function () {
    const currentPage = window.location.pathname.split("/").pop();

    if (currentPage === "history.html") {
        loadHistoryByMonth(currentYear, currentMonth); // Historial con paginación mensual
    } else if (currentPage === "register-local.html") {
        populateSubMenu(); // Cargar submenú dinámico
        populateUpdateLocalOptions(); // Opciones de actualización de locales
    } else if (currentPage === "inventory.html") {
        loadInventoryGrid(); // Mostrar clientes en la cuadrícula
    } else if (currentPage === "sales-report.html") {
        loadSalesReport(); // Cargar reporte de ventas
    } else if (currentPage === "treasury.html") {
        loadTreasuryIncome();   // Ingresos
        loadTreasuryExpenses(); // Egresos
    } else if (currentPage === "debtors.html") {
        loadDebtors(); // Lista de deudores
    } else if (currentPage === "delivery.html" || currentPage === "deliveries.html") {
        populateDeliveryOptions(); // Cargar opciones de entrega y recogida
    } else if (currentPage === "client-details.html") {
        loadClientDetails(); // Mostrar detalles del cliente
    }
};
// Cargar detalles del cliente y mostrar su inventario y transacciones
function loadClientDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const localName = urlParams.get("localName");
    const clientDetailsContainer = document.getElementById("clientDetails");

    if (!localName || !clientDetailsContainer) return;

    const local = inventory.find((item) => item.localName === localName);
    if (!local) {
        clientDetailsContainer.innerHTML = `<p>Cliente no encontrado.</p>`;
        updateLocalAndWarehouseTable("N/A", "N/A");
        return;
    }

    clientDetailsContainer.innerHTML = `
        <h2>Detalles del Cliente: ${localName}</h2>
        <p><strong>Dirección:</strong> ${local.address}</p>
        <p><strong>Correo:</strong> ${local.email || "No especificado"}</p>
        <div class="card">
            <h3>Inventario Actual</h3>
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Botellones</td>
                        <td>${local.stock}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="card">
            <h3>Historial de Transacciones</h3>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Transacción</th>
                        <th>Precio Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${local.history
                        .map(
                            (entry) => `
                            <tr>
                                <td>${entry.date}</td>
                                <td>${entry.product}</td>
                                <td>${entry.quantity}</td>
                                <td>${entry.transactionType}</td>
                                <td>${entry.totalPrice || "N/A"}</td>
                            </tr>`
                        )
                        .join("")}
                </tbody>
            </table>
        </div>
    `;

    updateLocalAndWarehouseTable(local.localStock, local.warehouseStock);
}
// Actualizar tabla de inventario: Local y Almacén
function updateLocalAndWarehouseTable(localStock, warehouseStock) {
    const localStockElement = document.getElementById("localStock");
    const warehouseStockElement = document.getElementById("warehouseStock");

    if (localStockElement) localStockElement.textContent = localStock || 0;
    if (warehouseStockElement) warehouseStockElement.textContent = warehouseStock || 0;
}
// Registrar actualización manual del inventario
function updateInventory(localName, newStock) {
    const local = inventory.find((item) => item.localName === localName);
    if (!local) {
        alert("Cliente no encontrado en el inventario.");
        return;
    }

    local.stock = parseInt(newStock, 10) || 0;
    saveInventory(); // Guardar los cambios
    alert(`El inventario de "${localName}" ha sido actualizado a ${local.stock} botellones.`);
    loadClientDetails(); // Recargar los detalles actualizados
}
window.onload = function () {
    const currentPage = window.location.pathname.split("/").pop();

    if (currentPage === "client-details.html") {
        loadClientDetails(); // Mostrar detalles del cliente
    } else if (currentPage === "history.html") {
        loadHistoryByMonth(currentYear, currentMonth);
    } else if (currentPage === "register-local.html") {
        populateSubMenu();
        populateUpdateLocalOptions();
    } else if (currentPage === "inventory.html") {
        loadInventoryGrid();
    } else if (currentPage === "sales-report.html") {
        loadSalesReport();
    } else if (currentPage === "treasury.html") {
        loadTreasuryIncome();
        loadTreasuryExpenses();
    } else if (currentPage === "debtors.html") {
        loadDebtors();
    } else if (currentPage === "delivery.html" || currentPage === "deliveries.html") {
        populateDeliveryOptions();
    }
};