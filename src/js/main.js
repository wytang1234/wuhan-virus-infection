import numeral from "numeral";
import populations from "./population.json";
import { getData } from "./api";

let tableData;
const filtered = {
  "Cruise Ship": 1
};

const totalNum = (data, field) => data.reduce((sum, d) => sum + (d[field] || 0), 0);

const totalRate = (data, field, baseField) => {
  const total = data.reduce((sum, d) => sum + d[field], 0);
  const totalBase = data.reduce((sum, d) => sum + (d[baseField] || 0), 0);
  return total/totalBase;
};

const renderList = () => {
  const filters = Object.keys(filtered);
  $("#data-table").bootstrapTable("refreshOptions", {
    data: (tableData || []).filter((d) => !filters.includes(d.region))
  });
};

const renderFilters = () => {
  const filterContainer = $(".filters").html("");
  const filters = Object.keys(filtered);
  filters.forEach((f) => {
    const chip = $("<span></span>").addClass("badge badge-pill badge-secondary");
    const closeBtn = $("<a>&times</a>").attr({ href: "#", region: f }).addClass("badge badge-pill badge-light");
    closeBtn.click((ev) => {
      const { region } = ev.target.attributes;
      delete filtered[region.nodeValue];
      console.log("click", filtered);
      renderList();
      renderFilters();
    });
    chip.append(f).append(closeBtn);
    filterContainer.append(chip);
  });
};

const filterEvents = {
  "click .remove": (ev, val, row, index) => {
    filtered[row.region] = 1;
    renderList();
    renderFilters();
  },
};

$(async () => {
  const table = $("#data-table");
  const rawData = await getData();
  const filters = Object.keys(filtered);
  tableData = rawData.map((data) => {
    const population = populations[data.Country_Region];
    return {
      region: data.Country_Region,
      population,
      confirmed: data.Confirmed,
      confirmedRate: population ? data.Confirmed/population : 0,
      death: data.Deaths,
      deathRate: data.Deaths/data.Confirmed,
      recovered: data.Recovered,
      recoveredRate: data.Recovered/data.Confirmed,
    };
  });
  table.bootstrapTable({
    data: tableData.filter((d) => !filters.includes(d.region)),
    height: 800,
    showFooter: true,
    columns: [{
      title: "排名", width: 50,
      formatter: (val, row, index) => index+1,
    }, {
      title: "國家/地區", field: "region", width: 300,
      footerFormatter: (data) => "總計",
    }, {
      title: "人口(萬)", field: "population", width: 100, align: "right", sortable: true,
      formatter: (val) => val ? numeral(val/10000).format("0,0") : "---",
      footerFormatter: (data) => numeral(totalNum(data, "population")/10000).format("0,0"),
    }, {
      title: "感染人數", field: "confirmed", width: 100, align: "right", sortable: true,
      formatter: (val) => numeral(val).format("0,0"),
      footerFormatter: (data) => numeral(totalNum(data, "confirmed")).format("0,0"),
    }, {
      title: "感染率(每萬)", field: "confirmedRate", width: 100, align: "right", sortable: true,
      formatter: (val, row) => row.population ? numeral(val*10000).format("0,0.000") : "---",
      footerFormatter: (data) => numeral(totalRate(data, "confirmed", "population")*10000).format("0,0.000"),
    }, {
      title: "死亡人數", field: "death", width: 100, align: "right", sortable: true, 
      formatter: (val) => numeral(val).format("0,0"),
      footerFormatter: (data) => numeral(totalNum(data, "death")).format("0,0"),
    }, {
      title: "死亡率", field: "deathRate", width: 100, align: "right", sortable: true,
      formatter: (val) => numeral(val).format("0.000%"),
      footerFormatter: (data) => numeral(totalRate(data, "death", "confirmed")).format("0.000%"),
    }, {
      title: "康復人數", field: "recovered", width: 100, align: "right", sortable: true,
      formatter: (val) => numeral(val).format("0,0"),
      footerFormatter: (data) => numeral(totalNum(data, "recovered")).format("0,0"),
    }, {
      title: "康復率", field: "recoveredRate", width: 100, align: "right", sortable: true,
      formatter: (val) => numeral(val).format("0.000%"),
      footerFormatter: (data) => numeral(totalRate(data, "recovered", "confirmed")).format("0.000%"),
    }, {
      title: "移除", align: "center",
      events: filterEvents,
      formatter: (val, row) => '<a class="remove badge  badge-danger" href="javascript:void(0)">&times</a>',
    }],
  });
  renderFilters();
});
