import { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import type { DataTableStateEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";
import { InputNumber } from "primereact/inputnumber";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";

import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

interface Artwork {
  id: number;
  title: string;
  artist_display: string;
  place_of_origin: string;
  date_start: number | null;
  date_end: number | null;
  inscriptions: string;
}

export default function Aw() {
  const [data, setData] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(1000);
  const [loading, setLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [first, setFirst] = useState(0);
  const rows = 5;

  const [pickNum, setPickNum] = useState<number | null>(null);
  const op = useRef<OverlayPanel>(null);

  const pageNum = first / rows + 1;

  // Fetch data for current page
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          "https://api.artic.edu/api/v1/artworks?page=" +
            pageNum +
            "&limit=" +
            rows
        );
        const d = await res.json();
        if (d.data) {
          setData(d.data);
          if (d.pagination && d.pagination.total) {
            setTotalRecords(d.pagination.total);
          }
        }
      } catch (err) {
        console.error("Error fetching:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [pageNum]);

  // Toggle single row
  const toggleRow = (id: number, checked: boolean) => {
    if (checked) {
      if (!selectedIds.includes(id)) setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    }
  };

  // Toggle all rows on current page
  const toggleAll = (checked: boolean) => {
    if (checked) {
      const newIds: number[] = [];
      for (let i = 0; i < data.length; i++) {
        if (!selectedIds.includes(data[i].id)) newIds.push(data[i].id);
      }
      setSelectedIds([...selectedIds, ...newIds]);
    } else {
      const remaining: number[] = [];
      for (let i = 0; i < selectedIds.length; i++) {
        if (!data.find((x) => x.id === selectedIds[i])) remaining.push(selectedIds[i]);
      }
      setSelectedIds(remaining);
    }
  };

  // Are all rows on page selected?
  let allSelected = true;
  for (let i = 0; i < data.length; i++) {
    if (!selectedIds.includes(data[i].id)) {
      allSelected = false;
      break;
    }
  }

  // Select N rows across pages
  const selectNRows = async (n: number) => {
    if (!n || n <= 0) return;
    let selected: number[] = [];
    let page = 1;
    while (selected.length < n) {
      try {
        const res = await fetch(
          "https://api.artic.edu/api/v1/artworks?page=" +
            page +
            "&limit=" +
            rows
        );
        const d = await res.json();
        if (!d.data || d.data.length === 0) break;
        for (let i = 0; i < d.data.length && selected.length < n; i++) {
          const id = d.data[i].id;
          if (!selected.includes(id)) selected.push(id);
        }
        page++;
      } catch (err) {
        console.error("Error selecting N rows:", err);
        break;
      }
    }
    setSelectedIds(selected);
  };

  // Header with checkbox + overlay panel
  const headerCheckbox = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Checkbox checked={allSelected} onChange={(e) => toggleAll(e.checked || false)} />
<i
  className="pi pi-list"
  style={{ cursor: "pointer", fontSize: 18 }}
  onClick={(e: React.MouseEvent<HTMLElement>) => {
    if (op.current) {
      op.current.show(undefined, e.currentTarget as HTMLElement);
    }
  }}
/>




      <OverlayPanel ref={op} dismissable style={{ padding: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <InputNumber
            value={pickNum}
            onValueChange={(e: any) => setPickNum(e.value ? e.value : null)}
            placeholder="Enter N"
            min={1}
            inputStyle={{ width: 80 }}
          />
          <Button
            label="Submit"
            className="p-button-sm"
            onClick={() => {
              if (pickNum) {
                selectNRows(pickNum);
                op.current?.hide();
              }
            }}
          />
        </div>
      </OverlayPanel>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Artworks (Page {pageNum})</h2>

      <DataTable
        value={data}
        paginator
        rows={rows}
        totalRecords={totalRecords}
        lazy
        first={first}
        loading={loading}
        onPage={(e: DataTableStateEvent) => setFirst(e.first)}
        dataKey="id"
      >
        <Column
          header={headerCheckbox}
          body={(row: Artwork) => (
            <Checkbox
              checked={selectedIds.includes(row.id)}
              onChange={(e) => toggleRow(row.id, e.checked || false)}
            />
          )}
          style={{ width: "3rem" }}
        />
        <Column field="title" header="Title" body={(a) => (a.title ? a.title : "Unknown")} />
        <Column field="artist_display" header="Artist" body={(a) => (a.artist_display ? a.artist_display : "Unknown")} />
        <Column field="place_of_origin" header="Origin" body={(a) => (a.place_of_origin ? a.place_of_origin : "Unknown")} />
        <Column field="date_start" header="Start" body={(a) => (a.date_start ? a.date_start : "-")} />
        <Column field="date_end" header="End" body={(a) => (a.date_end ? a.date_end : "-")} />
        <Column field="inscriptions" header="Inscriptions" body={(a) => (a.inscriptions ? a.inscriptions : "N/A")} />
      </DataTable>
    </div>
  );
}
