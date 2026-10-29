/* 待办记事本 - 纯 HTML/CSS/JS 实现
 * 数据存储在 localStorage，支持增删、完成、编辑、筛选
 */

(function () {
  "use strict";

  var STORAGE_KEY = "todo-list";
  var tasks = load();
  var filter = "all"; // all | active | completed

  /* ---------- DOM ---------- */
  var $form = document.getElementById("addForm");
  var $input = document.getElementById("taskInput");
  var $list = document.getElementById("taskList");
  var $count = document.getElementById("count");
  var $empty = document.getElementById("empty");
  var $clearBtn = document.getElementById("clearBtn");
  var $today = document.getElementById("today");
  var $filterBtns = document.querySelectorAll(".filter-btn");

  /* ---------- 工具 ---------- */
  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function formatTime(ts) {
    var d = new Date(ts);
    var pad = function (n) {
      return n < 10 ? "0" + n : "" + n;
    };
    return (
      d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes())
    );
  }

  /* ---------- 渲染 ---------- */
  function render() {
    var visible = tasks.filter(function (t) {
      if (filter === "active") return !t.done;
      if (filter === "completed") return t.done;
      return true;
    });

    $list.innerHTML = "";
    visible.forEach(function (task) {
      $list.appendChild(createItem(task));
    });

    var activeCount = tasks.filter(function (t) {
      return !t.done;
    }).length;

    $count.textContent = activeCount + " 项待办 / 共 " + tasks.length + " 项";
    $empty.hidden = visible.length > 0;
  }

  function createItem(task) {
    var li = document.createElement("li");
    li.className = "task-item" + (task.done ? " completed" : "");
    li.dataset.id = task.id;

    // 复选框
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "checkbox";
    checkbox.checked = task.done;
    checkbox.title = task.done ? "标记为未完成" : "标记为完成";
    checkbox.addEventListener("change", function () {
      task.done = checkbox.checked;
      save();
      render();
    });

    // 任务文字（双击编辑）
    var text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;
    text.title = "双击编辑";
    text.addEventListener("dblclick", function () {
      startEdit(li, task);
    });

    // 编辑输入框
    var editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "edit-input";
    editInput.maxLength = 100;

    // 创建时间
    var time = document.createElement("span");
    time.className = "task-time";
    time.textContent = formatTime(task.createdAt);

    // 删除按钮
    var delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "✕";
    delBtn.title = "删除任务";
    delBtn.addEventListener("click", function () {
      tasks = tasks.filter(function (t) {
        return t.id !== task.id;
      });
      save();
      render();
    });

    li.append(checkbox, text, editInput, time, delBtn);
    return li;
  }

  /* ---------- 双击编辑 ---------- */
  function startEdit(li, task) {
    if (li.classList.contains("editing")) return;
    li.classList.add("editing");

    var input = li.querySelector(".edit-input");
    input.value = task.text;
    input.focus();
    input.select();

    function finish(saveText) {
      li.classList.remove("editing");
      input.removeEventListener("blur", onBlur);
      input.removeEventListener("keydown", onKeydown);

      var val = input.value.trim();
      if (saveText && val) {
        task.text = val;
        save();
        render();
      }
    }

    function onKeydown(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        finish(true);
      } else if (e.key === "Escape") {
        finish(false);
      }
    }

    function onBlur() {
      finish(true);
    }

    input.addEventListener("keydown", onKeydown);
    input.addEventListener("blur", onBlur);
  }

  /* ---------- 事件 ---------- */
  $form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = $input.value.trim();
    if (!text) return;

    tasks.unshift({
      id: uid(),
      text: text,
      done: false,
      createdAt: Date.now(),
    });
    save();
    render();
    $input.value = "";
    $input.focus();
  });

  $filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      $filterBtns.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      filter = btn.dataset.filter;
      render();
    });
  });

  $clearBtn.addEventListener("click", function () {
    var hasCompleted = tasks.some(function (t) {
      return t.done;
    });
    if (!hasCompleted) return;

    if (confirm("确定清除所有已完成的任务吗？")) {
      tasks = tasks.filter(function (t) {
        return !t.done;
      });
      save();
      render();
    }
  });

  /* ---------- 初始化 ---------- */
  var weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  var now = new Date();
  $today.textContent =
    now.getFullYear() + " 年 " + (now.getMonth() + 1) + " 月 " +
    now.getDate() + " 日 · 星期" + weekdays[now.getDay()];

  render();
})();
