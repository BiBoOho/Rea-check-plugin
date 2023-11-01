jQuery.noConflict();

(function ($, Swal10, PLUGIN_ID) {
  "use strict";

  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (!Object.keys(config).length === 0) {
    return;
  }

  const db_id = config.db_id || ""; //get db_id from config
  const db_api_token = config.db_api_token || ""; //get db_api_token from config
  const display_items = config.display_items
    ? JSON.parse(config.display_items)
    : []; //get display_items from config
  const readed_quantity = config.readed_qty || ""; //get read_qty from config
  const space_display = config.space_display || ""; //get space_display from config
  const reset_value = config.reset_value || "no"; //get reset_value from config
  const unread = config.unread ? JSON.parse(config.unread) : {}; //get unread color from config
  const readed = config.readed ? JSON.parse(config.readed) : {}; //get read color from config

  // Set variable for display item
  const popUpContent = [
    {
      id: "datetimeDiv", // HTML class for table header
      text: "Date and time", // Text to show on table header
      name: "datetime", // Use to check value from config display item
    },
    {
      id: "usernameDiv", // HTML class for table header
      text: "Username", // Text to show on table header
      name: "username", // Use to check value from config display item
    },
    {
      id: "revisionDiv", // HTML class for table header
      text: "Revision", // Text to show on table header
      name: "revision", // Use to check value from config display item
    },
  ];

  // Set the read or unread color of the record row on the index show (desktop).
  kintone.events.on(
    ["app.record.index.show", "mobile.app.record.index.show"],
    async function (event) {
      try {
        let getUser = kintone.getLoginUser().code; // Get user login
        let records = event.records; // Get records

        if (records.length <= 0) return event; //Check if you have not recorded something.

        // Query default
        let query = `APP_ID = ${kintone.app.getId()} and USER_SELECT in ("${getUser}") and (`;

        //get data from Read DB
        for (let i = 0; i < records.length; i++) {
          let record = records[i];
          query += "RECORD_ID = " + record.$id.value;
          if (reset_value == "yes")
            query += " and REVISION=" + record.$revision.value;
          if (i != records.length - 1) query += " or ";
          else query += ")";
        }

        // Condition to get the data from Read DB App
        let parm = {
          app: db_id,
          query: query,
        };

        // Get data the data from Read DB App by using RsComAPI function
        let getData = await window.RsComAPI.getRecords(parm);
        let dataLength = getData.length;

        // Loop and check the same records.
        for (let k = 0; k < records.length; k++) {
          let record = records[k];

          // Get the field on the records
          let array = $.map(record, function (value, index) {
            return [index];
          });
          let fields;

          //condition for macth adata
          let i;
          for ( i = dataLength - 1; i >= 0 && getData[i].RECORD_ID.value !== record.$id.value; i--);

          // condition change color
          if (i >= 0) {
            // Get the field on the records
            for (let j = 0; j < array.length; j++) {
              let getType = array[j];
              fields =
                kintone.app.getFieldElements(getType) ||
                kintone.mobile.app.getFieldElements(getType);
              if (fields === null) {
                continue;
              } else {
                if (readed.bg !== "#" || readed.bg) {
                  $(fields[k])
                  .parent()
                  .css({ "background-color": readed.bg });
                }
                if (readed.text !== "#" || readed.text) {
                  $(fields[k])
                  .parent()
                  .css({ "color": readed.text });
                }
              }
            }
          } else {
            // Get the field on the records
            for (let j = 0; j < array.length; j++) {
              let getType = array[j];
              fields = kintone.app.getFieldElements(getType);
              if (fields === null) {
                continue;
              } else {
                if (unread.bg !== "#" || unread.bg) {
                  $(fields[k])
                  .parent()
                  .css({ "background-color": unread.bg });
                }
                if (unread.text !== "#" || unread.text) {
                  $(fields[k])
                  .parent()
                  .css({ "color": unread.text });
                }
              }
            }
          }
        }
      } catch (error) {
        return Swal10.fire("Error", error.message || error, "error");
      }
    }
  );

  // Function to fetch data from DB app
  const fetchRecordAndCheckUser = async (
    db_app_id,
    query,
    token,
    event_app_id,
    event_record_id,
    event_revision_id
  ) => {
    try {
      const userLogin = kintone.getLoginUser();
      let fetchRecordDB = await window.RsComAPI.getRecords({
        app: db_app_id,
        query: query,
        token: db_api_token,
      });
      // Check if user data not exist in DB app then insert new record to DB app
      let isCodeExist = fetchRecordDB.some((item) => {
        return (
          item.USER_SELECT.value.some((user) => user.code === userLogin.code) &&
          item.REVISION.value === event_revision_id
        );
      });
      if (!isCodeExist) {
        let body = {
          app: db_app_id,
          record: {
            APP_ID: {
              value: event_app_id,
            },
            RECORD_ID: {
              value: event_record_id,
            },
            REVISION: {
              value: event_revision_id,
            },
            USER_SELECT: {
              value: [
                {
                  code: userLogin.code,
                  name: userLogin.name,
                },
              ],
            },
          },
        };
        // Create record in DB app
        await window.RsComAPI.kintoneApi(
          kintone.api.url("/k/v1/record", true),
          "POST",
          body,
          token
        );
        // Push record that inserted to DB app to fetch data
        fetchRecordDB.push({
          REVISION: {
            value: event_revision_id,
          },
          USER_SELECT: {
            value: [
              {
                code: userLogin.code,
                name: userLogin.name,
              },
            ],
          },
          DATE_TIME: {
            value: Date.now(),
          },
        });
      }

      if (reset_value === "yes") {
        return fetchRecordDB;
      } else {
        // Sort the original array by revision Id in descending order
        fetchRecordDB.sort(
          (a, b) => parseInt(b.REVISION.value) - parseInt(a.REVISION.value)
        );

        // Create a new map to store the grouped entries
        let groupedMap = new Map();

        // Iterate over each entry in the original array
        for (let entry of fetchRecordDB) {
          let code = entry.USER_SELECT.value[0].code;

          // If the code is not present in the groupedMap, add the entry
          if (!groupedMap.has(code)) {
            groupedMap.set(code, entry);
          }
        }

        // Convert the groupedMap values to an array
        let finalizeRecord = Array.from(groupedMap.values());

        return finalizeRecord;
      }
    } catch (error) {
      return Swal10.fire("Error", error.message || error, "error");
    }
  };

  kintone.events.on(
    ["app.record.detail.show", "mobile.app.record.detail.show"],
    async function (event) {
      if (!db_id) return event; // check if DB app ID exist
      let showSpace;
      if (space_display === "header") {
        showSpace =
          kintone.app.record.getHeaderMenuSpaceElement() ||
          kintone.mobile.app.getHeaderSpaceElement();
      } else {
        showSpace =
          kintone.app.record.getSpaceElement(space_display) ||
          kintone.mobile.app.record.getSpaceElement(space_display);
        // if (!showSpace) return event;
      }

      const appId = event.appId;
      const recordId = event.recordId;
      const revisionId = event.record.$revision.value;
      let query = `APP_ID = "${appId}" and RECORD_ID = "${recordId}"`;
      if (reset_value === "yes") {
        query += ` and REVISION = "${revisionId}"`;
      }

      let fetchRecordDB = await fetchRecordAndCheckUser(
        db_id,
        query,
        db_api_token,
        appId,
        recordId,
        revisionId
      );
      if (!showSpace) return event;
      // Set read number to header or blank space
      let allRecordLength = fetchRecordDB.length;
      let label = readed_quantity.replace(
        /{%Num%}/g,
        `<a class='numClick' style='text-decoration:none;'>${allRecordLength}</a>`
      );
      let div = $("<h1>")
        .html(`${label}`)
        .css({ "font-size": "25px", margin: "0px" });
      $(showSpace).append(div);
      //check if device is mobile show number of read only
      if (event.type === "mobile.app.record.detail.show") return event;

      // Number of record to show on pop up
      let limitPerPage = 100;
      let totalPage = Math.ceil(allRecordLength / limitPerPage);

      $(document).on("click", ".numClick", function () {
        let curPage = 1;
        let setOrderBy = "";
        let setSortBy = "";
        let sortingStates = {};
        Swal10.fire({
          width: "66%",
          html: setTable(fetchRecordDB, 1),
          scrollbarPadding: false,
          showCancelButton: true,
          cancelButtonColor: "#48A1E0",
          cancelButtonText: "Close",
          showConfirmButton: false,
        });
        $(document)
          .off("click.numClick")
          .on("click.numClick", (e) => {
            // Table header click
            if ($(e.target).is("th")) {
              if (e.target.textContent === "Revision") {
                setSortBy = "REVISION";
              } else if (e.target.textContent === "Username") {
                setSortBy = "USER_SELECT";
              } else if (e.target.textContent === "Date and time") {
                setSortBy = "DATE_TIME";
              }
              // Set sort to setSortBy
              sortingStates[setSortBy] = sortingStates[setSortBy]
                ? sortingStates[setSortBy] === "asc"
                  ? "desc"
                  : ""
                : "asc";
              // Loop to set other property to ''
              for (const key in sortingStates) {
                if (key !== setSortBy) {
                  sortingStates[key] = "";
                }
              }
              setOrderBy = sortingStates[setSortBy];
              curPage = 1;
              setTable(fetchRecordDB, 1, setOrderBy, setSortBy);
              setSortIcon(setOrderBy, setSortBy);
              return;
            }

            // Next pevious button
            if (e.target.id === "prevIcon") {
              // Previous button
              if (curPage - 1 <= 0) return event;
              curPage--;
              setTable(fetchRecordDB, curPage, setOrderBy, setSortBy);
              setSortIcon(setOrderBy, setSortBy);
              return;
            }
            if (e.target.id === "nextIcon") {
              // Next button
              if (curPage + 1 > totalPage) return event;
              curPage++;
              setTable(fetchRecordDB, curPage, setOrderBy, setSortBy);
              setSortIcon(setOrderBy, setSortBy);
              return;
            }
          });
      });

      // Function to set sort icon by column
      function setSortIcon(orderBy, sortBy) {
        if (sortBy === "REVISION") {
          if (orderBy === "asc") {
            $(".revisionDiv.gg-arrow-up").css({ display: "inline" });
          } else if (orderBy === "desc") {
            $(".revisionDiv.gg-arrow-down").css({ display: "inline" });
          } else {
            $(".revisionDiv.gg-arrow-up").css({ display: "none" });
            $(".revisionDiv.gg-arrow-down").css({ display: "none" });
          }
        } else if (sortBy === "USER_SELECT") {
          if (orderBy === "asc") {
            $(".usernameDiv.gg-arrow-up").css({ display: "inline" });
          } else if (orderBy === "desc") {
            $(".usernameDiv.gg-arrow-down").css({ display: "inline" });
          } else {
            $(".usernameDiv.gg-arrow-up").css({ display: "none" });
            $(".usernameDiv.gg-arrow-down").css({ display: "none" });
          }
        } else if (sortBy === "DATE_TIME") {
          if (orderBy === "asc") {
            $(".datetimeDiv.gg-arrow-up").css({ display: "inline" });
          } else if (orderBy === "desc") {
            $(".datetimeDiv.gg-arrow-down").css({ display: "inline" });
          } else {
            $(".datetimeDiv.gg-arrow-up").css({ display: "none" });
            $(".datetimeDiv.gg-arrow-down").css({ display: "none" });
          }
        }
      }

      // Function to convert date format
      function reformatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }

      // Function to set table with records, page and sort params
      function setTable(records, page, order_by, sort_by) {
        let rows = records.map((item) => ({
          ...item,
          DATE_TIME: {
            ...item.DATE_TIME,
            value: reformatDate(item.DATE_TIME.value),
          },
        }));
        let sortedRows = [];
        if (order_by && sort_by) {
          switch (order_by) {
            case "asc":
              switch (sort_by) {
                // Cases for sorting ascending
                case "USER_SELECT":
                  sortedRows = [...rows].sort((a, b) =>
                    a.USER_SELECT.value[0].name.localeCompare(
                      b.USER_SELECT.value[0].name
                    )
                  );
                  break;
                case "REVISION":
                  sortedRows = [...rows].sort(
                    (a, b) =>
                      parseInt(a.REVISION.value) - parseInt(b.REVISION.value)
                  );
                  break;
                case "DATE_TIME":
                  sortedRows = [...rows].sort(
                    (a, b) =>
                      new Date(a.DATE_TIME.value) - new Date(b.DATE_TIME.value)
                  );
                  break;
              }
              break;
            case "desc":
              switch (sort_by) {
                // Cases for sorting descending
                case "USER_SELECT":
                  sortedRows = [...rows].sort((a, b) =>
                    b.USER_SELECT.value[0].name.localeCompare(
                      a.USER_SELECT.value[0].name
                    )
                  );
                  break;
                case "REVISION":
                  sortedRows = [...rows].sort(
                    (a, b) =>
                      parseInt(b.REVISION.value) - parseInt(a.REVISION.value)
                  );
                  break;
                case "DATE_TIME":
                  sortedRows = [...rows].sort(
                    (a, b) =>
                      new Date(b.DATE_TIME.value) - new Date(a.DATE_TIME.value)
                  );
                  break;
              }
              break;
          }
        } else {
          sortedRows = rows;
        }

        // Caluculate page
        let currentPage = page;
        let offset = (currentPage - 1) * limitPerPage;
        let endIndex = offset + limitPerPage;
        let dataTable = sortedRows.slice(offset, endIndex);
        let divEl = "";

        // Check if table exists if yes clear old table
        if ($("#divEl").length > 0) {
          divEl = $("#divEl").empty();
        } else {
          divEl = $("<div>").css({
            height: "400px",
            display: "inline-flex",
            "flex-direction": "column",
            "justify-content": "space-between",
          });
          divEl.attr("id", "divEl");
        }

        let table = $("<table>");
        let thead = $("<thead>");
        let headerRow = $("<tr>");

        // Create thead cell
        let list = display_items;
        $.each(list, function (index, item) {
          let selectPopup = popUpContent.filter(
            (popup) => popup.name === item.label
          )[0];
          let headerCell = $("<th>")
            .text(selectPopup.text)
            .css({ cursor: "pointer" })
            .append(
              $("<span>")
                .addClass(`${selectPopup.id} gg-arrow-down`)
                .css({ display: "none" }),
              $("<span>")
                .addClass(`${selectPopup.id} gg-arrow-up`)
                .css({ display: "none" })
            );
          headerRow.append(headerCell);
        });

        thead.append(headerRow);
        table.append(thead);

        // Create tbody cell
        let tbody = $("<tbody>").attr("id", "tbody");

        $.each(dataTable, function (index, item) {
          let row = $("<tr>");
          $.each(list, function (idx, item2) {
            $.each(item, function (key, value) {
              if (key == item2.code) {
                let cell = $("<td>");
                if (key === "USER_SELECT") {
                  cell.text(value.value[0].name); // Append USER_SELECT field code
                } else {
                  cell.text(value.value); // Append DATE_TIME and REVISION field code
                }
                row.append(cell);
              }
            });
          });
          tbody.append(row);
        });

        table.append(tbody);
        let divFixTable = $("<div>").addClass("tableFixHead").append(table);
        divEl.append(divFixTable);

        // Pagination append
        let pagination = $("<div>").css({
          display: "flex",
          "justify-content": "center",
          "margin-top": "1rem",
          "margin-right": "30px",
        });

        // Create previous Icon
        let prevIcon = $("<span>").text("<Previous");
        prevIcon
          .css({
            cursor: "pointer",
            "margin-right": "10px",
          })
          .attr("id", "prevIcon");

        // Create next Icon
        let nextIcon = $("<span>").text("Next>");
        nextIcon
          .css({
            cursor: "pointer",
            "margin-left": "10px",
          })
          .attr("id", "nextIcon");

        // Create current page
        let currentPageElement = $("<span>").text(currentPage);
        pagination.append(prevIcon);
        pagination.append(currentPageElement);
        pagination.append(nextIcon);
        divEl.append(pagination);

        //check totalPage and current page for show and hide buttons(next and previous)
        if (totalPage === 1) {
          nextIcon.css("color", "transparent");
          prevIcon.css("color", "transparent");
        } else if (currentPage === 1) {
          prevIcon.css("color", "transparent");
        } else if (currentPage === totalPage) {
          nextIcon.css("color", "transparent");
        } else {
          prevIcon.show();
          nextIcon.show();
        }

        // Append divEl to a container element in your HTML
        $("#container").append(divEl);

        return divEl;
      }
      return event;
    }
  );
})(jQuery, Sweetalert2_10.noConflict(true), kintone.$PLUGIN_ID);
