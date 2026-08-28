"use strict";

const state = {
  settings: null,
  rechargeRequests: [],
  withdrawalRequests: [],
  profiles: [],
  orders: []
};

const supabase = window.supabaseClient;

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function formatMoney(value) {
  const number = Number(value) || 0;

  return number.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


async function loadSettings() {
  try {
    const { data, error } = await supabase
      .from("macheya_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;

    state.settings = data || {};

    const fee = document.getElementById("feePercentage");
    const moncash = document.getElementById("moncashNumber");
    const natcash = document.getElementById("natcashNumber");

    if (fee) {
      fee.value = data?.fee_percentage ?? 0;
    }

    if (moncash) {
      moncash.value = data?.moncash_number ?? "";
    }

    if (natcash) {
      natcash.value = data?.natcash_number ?? "";
    }

  } catch (error) {
    console.error("Settings error:", error);
  }
}


async function saveSettings() {
  const fee = document.getElementById("feePercentage");
  const moncash = document.getElementById("moncashNumber");
  const natcash = document.getElementById("natcashNumber");
  const message = document.getElementById("settingsMessage");

  if (!fee || !moncash || !natcash) return;

  const feeValue = Number(fee.value);

  if (
    Number.isNaN(feeValue) ||
    feeValue < 0 ||
    feeValue > 100
  ) {
    if (message) {
      message.textContent =
        "Pousantaj la dwe ant 0 ak 100.";
      message.style.display = "block";
    }

    return;
  }

  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      if (message) {
        message.textContent =
          "Ou pa konekte kòm admin.";
        message.style.display = "block";
      }

      return;
    }

    const { error } = await supabase
      .from("macheya_settings")
      .upsert({
        id: 1,
        fee_percentage: feeValue,
        moncash_number: moncash.value.trim(),
        natcash_number: natcash.value.trim(),
        updated_by: user.id,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    state.settings = {
      id: 1,
      fee_percentage: feeValue,
      moncash_number: moncash.value.trim(),
      natcash_number: natcash.value.trim()
    };

    if (message) {
      message.textContent =
        "Paramèt yo sove avèk siksè.";
      message.style.display = "block";
    }

  } catch (error) {
    console.error("Save settings error:", error);

    if (message) {
      message.textContent =
        error.message ||
        "Pa kapab sove paramèt yo.";

      message.style.display = "block";
    }
  }
}


async function loadProfiles() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*");

    if (error) throw error;

    state.profiles = data || [];

    const buyers = state.profiles.filter(
      profile => profile.role === "acheteur"
    ).length;

    const sellers = state.profiles.filter(
      profile => profile.role === "vendeur"
    ).length;

    setText("buyers", buyers);
    setText("sellers", sellers);
    setText("users", state.profiles.length);

  } catch (error) {
    console.error("Profiles error:", error);

    setText("buyers", "0");
    setText("sellers", "0");
    setText("users", "0");
  }
}


async function loadOrders() {
  try {
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    state.orders = data || [];

    const orders = state.orders.filter(
      item =>
        item.type === "purchase" ||
        item.type === "order" ||
        item.type === "commande"
    );

    setText("orders", orders.length);

  } catch (error) {
    console.error("Orders error:", error);

    setText("orders", "0");
  }
}


async function loadRechargeRequests() {
  const container =
    document.getElementById("rechargeRequests");

  if (!container) return;

  container.innerHTML =
    `<div class="loading">
      Ap chèche demann rechaj...
    </div>`;

  try {
    const { data, error } = await supabase
      .from("recharge_requests")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    state.rechargeRequests = data || [];

    if (!state.rechargeRequests.length) {
      container.innerHTML =
        `<div class="empty">
          Pa gen demann rechaj pou kounye a.
        </div>`;

      return;
    }

    container.innerHTML =
      state.rechargeRequests
        .map(request => {

          const amount =
            request.amount ??
            request.montant ??
            request.value ??
            0;

          const method =
            request.method ??
            request.payment_method ??
            request.type ??
            "—";

          const status =
            request.status ??
            "pending";

          const phone =
            request.phone_number ??
            request.phone ??
            request.number ??
            "—";

          const statusClass =
            status === "approved"
              ? "approved"
              : status === "rejected"
                ? "rejected"
                : "pending";

          return `
            <div class="request-card">

              <div>
                <strong>
                  💰 ${formatMoney(amount)} HTG
                </strong>

                <span>
                  ${escapeHTML(method)}
                </span>
              </div>

              <div>
                📱 ${escapeHTML(phone)}
              </div>

              <div>
                <small>
                  ${formatDate(request.created_at)}
                </small>
              </div>

              <div class="request-status ${statusClass}">
                ${escapeHTML(status)}
              </div>

              ${
                status === "pending"
                  ? `
                    <div class="request-actions">

                      <button
                        class="approve-btn"
                        onclick="updateRechargeStatus('${escapeHTML(request.id)}','approved')"
                        type="button"
                      >
                        ✓ Aksepte
                      </button>

                      <button
                        class="reject-btn"
                        onclick="updateRechargeStatus('${escapeHTML(request.id)}','rejected')"
                        type="button"
                      >
                        ✕ Refize
                      </button>

                    </div>
                  `
                  : ""
              }

            </div>
          `;
        })
        .join("");

  } catch (error) {
    console.error("Recharge error:", error);

    container.innerHTML =
      `<div class="error">
        ${escapeHTML(error.message)}
      </div>`;
  }
}


async function updateRechargeStatus(id, status) {
  try {
    const { error } = await supabase
      .from("recharge_requests")
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;

    await loadRechargeRequests();

  } catch (error) {
    console.error(
      "Recharge update error:",
      error
    );

    alert(
      error.message ||
      "Pa kapab mete ajou demann lan."
    );
  }
}


async function loadWithdrawalRequests() {
  const container =
    document.getElementById("withdrawalRequests");

  if (!container) return;

  container.innerHTML =
    `<div class="loading">
      Ap chèche demann retrè...
    </div>`;

  try {
    const { data, error } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    state.withdrawalRequests = data || [];

    const pending =
      state.withdrawalRequests.filter(
        request =>
          (request.status || "pending") === "pending"
      );

    const totalWithdrawal =
      state.withdrawalRequests.reduce(
        (sum, request) =>
          sum +
          Number(
            request.amount ??
            request.montant ??
            0
          ),
        0
      );

    setText(
      "withdrawals",
      `${formatMoney(totalWithdrawal)} HTG`
    );

    if (!pending.length) {
      container.innerHTML =
        `<div class="empty">
          Pa gen okenn demann retrè pou kounye a.
        </div>`;

      return;
    }

    container.innerHTML =
      pending
        .map(request => {

          const amount =
            request.amount ??
            request.montant ??
            0;

          const method =
            request.method ??
            request.payment_method ??
            "—";

          const number =
            request.phone_number ??
            request.phone ??
            request.number ??
            "—";

          return `
            <div class="request-card">

              <div>
                <strong>
                  💸 ${formatMoney(amount)} HTG
                </strong>
              </div>

              <div>
                📱 ${escapeHTML(number)}
              </div>

              <div>
                💳 ${escapeHTML(method)}
              </div>

              <div>
                <small>
                  ${formatDate(request.created_at)}
                </small>
              </div>

              <div class="request-status pending">
                pending
              </div>

              <div class="request-actions">

                <button
                  class="approve-btn"
                  onclick="updateWithdrawalStatus('${escapeHTML(request.id)}','approved')"
                  type="button"
                >
                  ✓ Peye
                </button>

                <button
                  class="reject-btn"
                  onclick="updateWithdrawalStatus('${escapeHTML(request.id)}','rejected')"
                  type="button"
                >
                  ✕ Refize
                </button>

              </div>

            </div>
          `;
        })
        .join("");

  } catch (error) {
    console.error(
      "Withdrawal error:",
      error
    );

    container.innerHTML =
      `<div class="error">
        ${escapeHTML(error.message)}
      </div>`;
  }
}
async function updateWithdrawalStatus(id, status) {
  try {
    const { data: currentRequest, error: fetchError } =
      await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (fetchError) throw fetchError;

    if (!currentRequest) {
      throw new Error("Demann retrè a pa egziste.");
    }

    const currentStatus =
      currentRequest.status || "pending";

    if (currentStatus !== "pending") {
      throw new Error(
        "Demann sa a deja trete."
      );
    }

    const { error } = await supabase
      .from("withdrawal_requests")
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("status", "pending");

    if (error) throw error;

    await Promise.all([
      loadWithdrawalRequests(),
      loadFinancialStats()
    ]);

  } catch (error) {
    console.error(
      "Withdrawal update error:",
      error
    );

    alert(
      error.message ||
      "Pa kapab mete ajou demann retrè a."
    );
  }
}


function getTransactionAmount(transaction) {
  return Number(
    transaction?.amount ??
    transaction?.montant ??
    transaction?.value ??
    transaction?.total ??
    transaction?.price ??
    0
  ) || 0;
}


function normalizeTransactionType(transaction) {
  return String(
    transaction?.type ??
    transaction?.transaction_type ??
    transaction?.category ??
    ""
  )
    .trim()
    .toLowerCase();
}


function isDepositTransaction(transaction) {
  const type =
    normalizeTransactionType(transaction);

  return [
    "deposit",
    "depot",
    "recharge",
    "topup",
    "top_up",
    "credit"
  ].includes(type);
}


function isWithdrawalTransaction(transaction) {
  const type =
    normalizeTransactionType(transaction);

  return [
    "withdrawal",
    "withdraw",
    "retrait",
    "debit"
  ].includes(type);
}


function isFeeTransaction(transaction) {
  const type =
    normalizeTransactionType(transaction);

  return [
    "fee",
    "fees",
    "frais",
    "commission",
    "macheya_fee"
  ].includes(type);
}


function isPurchaseTransaction(transaction) {
  const type =
    normalizeTransactionType(transaction);

  return [
    "purchase",
    "order",
    "commande",
    "payment",
    "purchase_payment"
  ].includes(type);
}


async function loadFinancialStats() {
  try {
    const {
      data: transactions,
      error
    } = await supabase
      .from("wallet_transactions")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    const list = transactions || [];

    let deposits = 0;
    let withdrawals = 0;
    let fees = 0;

    list.forEach(transaction => {
      const amount =
        getTransactionAmount(transaction);

      if (isDepositTransaction(transaction)) {
        deposits += amount;
      }

      if (isWithdrawalTransaction(transaction)) {
        withdrawals += amount;
      }

      if (isFeeTransaction(transaction)) {
        fees += amount;
      }
    });

    /*
     * Si fee yo pa anrejistre kòm yon transaction,
     * nou kalkile yo apati retrè ki apwouve yo.
     */
    if (fees === 0) {
      const feePercentage =
        Number(
          state.settings?.fee_percentage ?? 0
        );

      if (feePercentage > 0) {
        const approvedWithdrawals =
          state.withdrawalRequests.filter(
            request =>
              request.status === "approved"
          );

        withdrawals =
          approvedWithdrawals.reduce(
            (sum, request) =>
              sum +
              Number(
                request.amount ??
                request.montant ??
                0
              ),
            0
          );

        fees =
          withdrawals *
          (feePercentage / 100);
      }
    }

    /*
     * Lajan ki rete nan sistèm nan:
     * depo - retrè.
     */
    const circulation =
      Math.max(0, deposits - withdrawals);

    setText(
      "deposits",
      `${formatMoney(deposits)} HTG`
    );

    setText(
      "withdrawals",
      `${formatMoney(withdrawals)} HTG`
    );

    setText(
      "fees",
      `${formatMoney(fees)} HTG`
    );

    setText(
      "circulation",
      `${formatMoney(circulation)} HTG`
    );

    state.financialStats = {
      deposits,
      withdrawals,
      fees,
      circulation
    };

  } catch (error) {
    console.error(
      "Financial stats error:",
      error
    );

    setText("deposits", "0 HTG");
    setText("withdrawals", "0 HTG");
    setText("fees", "0 HTG");
    setText("circulation", "0 HTG");
  }
}


async function refreshDashboard() {
  try {
    await loadSettings();
    await loadProfiles();
    await loadOrders();
    await loadRechargeRequests();
    await loadWithdrawalRequests();
    await loadFinancialStats();
  } catch (error) {
    console.error(
      "Dashboard refresh error:",
      error
    );
  }
}


function setupRechargeRefresh() {
  const button =
    document.getElementById("refreshRecharge");

  if (!button) return;

  button.addEventListener(
    "click",
    async () => {
      button.disabled = true;

      try {
        await loadRechargeRequests();
        await loadFinancialStats();
      } finally {
        button.disabled = false;
      }
    }
  );
}


function setupWithdrawalRefresh() {
  const button =
    document.getElementById("refreshWithdrawal");

  if (!button) return;

  button.addEventListener(
    "click",
    async () => {
      button.disabled = true;

      try {
        await loadWithdrawalRequests();
        await loadFinancialStats();
      } finally {
        button.disabled = false;
      }
    }
  );
}


function setupSettings() {
  const button =
    document.getElementById("saveSettings");

  if (!button) return;

  button.addEventListener(
    "click",
    async () => {
      button.disabled = true;

      try {
        await saveSettings();
      } finally {
        button.disabled = false;
      }
    }
  );
}


function setupQuickActions() {
  const walletButton =
    document.getElementById("walletButton");

  const settingsWalletButton =
    document.getElementById(
      "settingsWalletButton"
    );

  if (walletButton) {
    walletButton.addEventListener(
      "click",
      () => {
        window.location.href =
          "wallet.html";
      }
    );
  }

  if (settingsWalletButton) {
    settingsWalletButton.addEventListener(
      "click",
      () => {
        const settings =
          document.querySelector(
            ".settings-grid"
          );

        if (settings) {
          settings.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }
      }
    );
  }
}


function setupLogout() {
  const button =
    document.getElementById("logout");

  if (!button) return;

  button.addEventListener(
    "click",
    async () => {
      try {
        const { error } =
          await supabase.auth.signOut();

        if (error) throw error;

        window.location.reload();

      } catch (error) {
        console.error(
          "Logout error:",
          error
        );

        alert(
          error.message ||
          "Pa kapab dekonekte."
        );
      }
    }
  );
                      }

async function isSuperAdmin(userId) {
  if (!userId) return false;

  try {
    const { data, error } = await supabase
      .from("super_admins")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    return !!data;

  } catch (error) {
    console.error(
      "Super admin verification error:",
      error
    );

    return false;
  }
}


async function checkAdminSession() {
  const loginPage =
    document.getElementById("loginPage");

  const adminPage =
    document.getElementById("adminPage");

  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user) {
      if (loginPage) {
        loginPage.style.display = "flex";
      }

      if (adminPage) {
        adminPage.style.display = "none";
      }

      return false;
    }

    const allowed =
      await isSuperAdmin(session.user.id);

    if (!allowed) {
      await supabase.auth.signOut();

      if (loginPage) {
        loginPage.style.display = "flex";
      }

      if (adminPage) {
        adminPage.style.display = "none";
      }

      showLoginMessage(
        "Aksè refize. Kont sa a pa Super Admin.",
        true
      );

      return false;
    }

    if (loginPage) {
      loginPage.style.display = "none";
    }

    if (adminPage) {
      adminPage.style.display = "block";
    }

    await refreshDashboard();

    return true;

  } catch (error) {
    console.error(
      "Session check error:",
      error
    );

    if (loginPage) {
      loginPage.style.display = "flex";
    }

    if (adminPage) {
      adminPage.style.display = "none";
    }

    return false;
  }
}


function showLoginMessage(message, isError = false) {
  const element =
    document.getElementById("loginMessage");

  if (!element) return;

  element.textContent = message;
  element.style.display = "block";

  if (isError) {
    element.classList.add("error");
  } else {
    element.classList.remove("error");
  }
}


function setupLogin() {
  const form =
    document.getElementById("loginForm");

  const button =
    document.getElementById("loginButton");

  if (!form) return;

  form.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const email =
        document.getElementById("email")?.value
          .trim();

      const password =
        document.getElementById("password")?.value;

      if (!email || !password) {
        showLoginMessage(
          "Tanpri ranpli email ak modpas la.",
          true
        );

        return;
      }

      if (button) {
        button.disabled = true;
        button.textContent =
          "Ap konekte...";
      }

      showLoginMessage("");

      try {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email,
            password
          });

        if (error) throw error;

        if (!data?.user) {
          throw new Error(
            "Pa kapab jwenn kont itilizatè a."
          );
        }

        const allowed =
          await isSuperAdmin(data.user.id);

        if (!allowed) {
          await supabase.auth.signOut();

          throw new Error(
            "Aksè refize. Kont sa a pa Super Admin."
          );
        }

        showLoginMessage(
          "Koneksyon reyisi. Byenveni Super Admin."
        );

        await checkAdminSession();

      } catch (error) {
        console.error(
          "Login error:",
          error
        );

        showLoginMessage(
          error.message ||
          "Email oswa modpas la pa kòrèk.",
          true
        );

      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = "Konekte";
        }
      }
    }
  );
}


function getWithdrawalDateKey(dateValue) {
  if (!dateValue) return null;

  const date =
    new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString()
    .split("T")[0];
}


function formatChartDate(dateValue) {
  const date =
    new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "2-digit"
    }
  );
}


function getChartDays(numberOfDays) {
  const days = [];
  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  for (
    let index = numberOfDays - 1;
    index >= 0;
    index--
  ) {
    const date = new Date(today);

    date.setDate(
      today.getDate() - index
    );

    days.push(
      date.toISOString()
        .split("T")[0]
    );
  }

  return days;
}


function drawWithdrawalChart() {
  const canvas =
    document.getElementById("chart");

  if (!canvas) return;

  const context =
    canvas.getContext("2d");

  if (!context) return;

  const period =
    Number(
      document.getElementById("period")?.value
    ) || 30;

  const days =
    getChartDays(period);

  const totals = {};

  days.forEach(day => {
    totals[day] = 0;
  });

  state.withdrawalRequests.forEach(
    request => {

      const date =
        getWithdrawalDateKey(
          request.created_at
        );

      if (!date || totals[date] === undefined) {
        return;
      }

      const amount =
        Number(
          request.amount ??
          request.montant ??
          0
        ) || 0;

      totals[date] += amount;
    }
  );

  const values =
    days.map(day => totals[day]);

  const width =
    canvas.clientWidth || 700;

  const height =
    canvas.clientHeight || 320;

  const ratio =
    window.devicePixelRatio || 1;

  canvas.width =
    width * ratio;

  canvas.height =
    height * ratio;

  context.setTransform(
    ratio,
    0,
    0,
    ratio,
    0,
    0
  );

  context.clearRect(
    0,
    0,
    width,
    height
  );

  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartWidth =
    width -
    paddingLeft -
    paddingRight;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  const maxValue =
    Math.max(...values, 1);

  const gridLines = 5;

  context.font =
    "12px Arial";

  context.textAlign =
    "right";

  context.textBaseline =
    "middle";

  for (
    let index = 0;
    index <= gridLines;
    index++
  ) {
    const value =
      (maxValue / gridLines) *
      index;

    const y =
      paddingTop +
      chartHeight -
      (
        index /
        gridLines
      ) *
      chartHeight;

    context.beginPath();

    context.moveTo(
      paddingLeft,
      y
    );

    context.lineTo(
      width - paddingRight,
      y
    );

    context.strokeStyle =
      "rgba(0,0,0,0.08)";

    context.lineWidth = 1;

    context.stroke();

    context.fillStyle =
      "#666";

    context.fillText(
      formatMoney(value),
      paddingLeft - 8,
      y
    );
  }

  const points = [];

  values.forEach(
    (value, index) => {

      const x =
        days.length === 1
          ? paddingLeft +
            chartWidth / 2
          : paddingLeft +
            (
              index /
              (days.length - 1)
            ) *
            chartWidth;

      const y =
        paddingTop +
        chartHeight -
        (
          value /
          maxValue
        ) *
        chartHeight;

      points.push({
        x,
        y,
        value
      });
    }
  );

  if (points.length) {

    context.beginPath();

    points.forEach(
      (point, index) => {

        if (index === 0) {
          context.moveTo(
            point.x,
            point.y
          );
        } else {
          context.lineTo(
            point.x,
            point.y
          );
        }
      }
    );

    context.strokeStyle =
      "#F97316";

    context.lineWidth = 3;

    context.lineJoin =
      "round";

    context.lineCap =
      "round";

    context.stroke();


    points.forEach(point => {

      context.beginPath();

      context.arc(
        point.x,
        point.y,
        4,
        0,
        Math.PI * 2
      );

      context.fillStyle =
        "#F97316";

      context.fill();
    });
  }

  context.textAlign =
    "center";

  context.textBaseline =
    "top";

  context.fillStyle =
    "#666";

  const labelStep =
    Math.max(
      1,
      Math.ceil(
        days.length / 7
      )
    );

  days.forEach(
    (day, index) => {

      if (
        index % labelStep !== 0 &&
        index !== days.length - 1
      ) {
        return;
      }

      const point =
        points[index];

      if (!point) return;

      context.fillText(
        formatChartDate(day),
        point.x,
        height -
          paddingBottom +
          12
      );
    }
  );
}


function setupChart() {
  const period =
    document.getElementById("period");

  if (period) {
    period.addEventListener(
      "change",
      () => {
        drawWithdrawalChart();
      }
    );
  }

  window.addEventListener(
    "resize",
    () => {
      if (
        document.getElementById("adminPage")
          ?.style.display !== "none"
      ) {
        drawWithdrawalChart();
      }
    }
  );
}


async function refreshWithdrawalData() {
  await loadWithdrawalRequests();

  drawWithdrawalChart();

  await loadFinancialStats();
}


async function initializeAdmin() {
  const loginPage =
    document.getElementById("loginPage");

  const adminPage =
    document.getElementById("adminPage");

  if (loginPage) {
    loginPage.style.display = "flex";
  }

  if (adminPage) {
    adminPage.style.display = "none";
  }

  setupLogin();
  setupRechargeRefresh();
  setupWithdrawalRefresh();
  setupSettings();
  setupQuickActions();
  setupLogout();
  setupChart();

  const authenticated =
    await checkAdminSession();

  if (authenticated) {
    drawWithdrawalChart();
  }
}


if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initializeAdmin
  );
} else {
  initializeAdmin();
}
