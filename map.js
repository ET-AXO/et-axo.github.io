var map = L.map('map').setView([48.6495180, -2.0260409], 17 );

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
    maxZoom: 19,
    ext: 'jpg'
}).addTo(map);


const markersLayer = L.layerGroup().addTo(map);
const STORAGE_KEY = "lieu_recherche";
let searchs = [];
/** @types {Map<string, import('leaflet').Marker} */
const markerById = new Map();

const input = document.getElementById("input");
const btn = document.getElementById("search");
const ul = document.getElementById("list");
let star = 5

var treeIcon = L.icon({
    iconUrl: './images/sapin-de-noel.png',

    iconSize:     [38, 50], // size of the icon
    iconAnchor:   [22, 50], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -55] // point from which the popup should open relative to the iconAnchor
});

let delSvg = `<svg
    class="trash-svg"
    viewBox="0 -10 64 74"
    xmlns="http://www.w3.org/2000/svg"
    >
        <g id="trash-can">
        <rect
            x="16"
            y="24"
            width="32"
            height="30"
            rx="3"
            ry="3"
            fill="#e74c3c"
        ></rect>

        <g transform-origin="12 18" id="lid-group">
            <rect
            x="12"
            y="12"
            width="40"
            height="6"
            rx="2"
            ry="2"
            fill="#c0392b"
            ></rect>
            <rect
            x="26"
            y="8"
            width="12"
            height="4"
            rx="2"
            ry="2"
            fill="#c0392b"
            ></rect>
        </g>
        </g>
    </svg>`;

let starSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path pathLength="360" d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"></path></svg>`

const uid = () => 
    crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random;

// Methods
async function addSearch(){
    const query = input.value.trim();
    if (!query) return;

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "1");

    try {
        const res = await fetch(url.toString(), {
            headers: {
                Accept: "application/json",
                "User-Agent": "LeafletSearchDemo/1.0"
            },
        });
        if (!res.ok) throw new Error("HTTP " + res.status);

        const data = await res.json();
        if(!data.length){
            console.log("Aucunes données");
        }
        console.log(data);
        var lieu = data[0]
        var item = {
            id: uid(),
            name:lieu.display_name,
            lon:lieu.lon,
            lat:lieu.lat,
            query,
            note: 0
        }

        searchs.unshift(item)
        addMarker(item)
        map.setView([item.lat,item.lon], 15, {animate:true})
        save();
        renderLists();

        input.value = "";
    } catch (err){
        console.error(err);
    }
}

function addMarker(item){
    const marker = L.marker([item.lat,item.lon], {icon: treeIcon})
        .addTo(markersLayer)
        .bindPopup(item.name)
        .openPopup();

    markerById.set(item.id, marker);
}

function delMarker(id){
    const marker = markerById.get(id);
    if(marker){
        markersLayer.removeLayer(marker);
        markerById.delete(id);
    }
}

function save(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searchs));
}

function load(){
    try {
        const storage = localStorage.getItem(STORAGE_KEY);
        if(storage){
            searchs = JSON.parse(storage);
        }
    } catch {
        searchs = [];
    }
}

function renderLists(){
    ul.innerHTML = "";
    for (const item of searchs){
        const li = document.createElement("li");

        const top = document.createElement("div")
        top.className = "row";

        const btns = document.createElement("div");
        btns.className = "row";

        const delBtn = document.createElement("button");
        delBtn.className = "delete-button";
        delBtn.onclick = () => {
            searchs = searchs.filter((s) => s.id !== item.id);
            delMarker(item.id);
            save();
            renderLists();
        }
        


        delBtn.innerHTML = delSvg;

        btns.appendChild(delBtn);

        const title = document.createElement("div");
        title.className = "name";
        title.textContent = item.query;

        top.appendChild(title);
        top.appendChild(btns);

        li.appendChild(top);

        const noteRow = document.createElement("div");
        noteRow.className = "row";

        const noteRadios = document.createElement("div");
        noteRadios.className = "rating";

        for (let i = star; i >= 1; i--){
            const inputRadio = document.createElement("input");
            inputRadio.type = "radio";
            inputRadio.value = i;

            const radioId = `star-${item.id}-${i}`;
            inputRadio.id = radioId;
            inputRadio.name = `star-radio-${item.id}`;

            inputRadio.checked = item.note === i;

            inputRadio.addEventListener("change", () => {
                if(inputRadio.checked){
                    setNote(item.id, i);
                    console.log(i)
                }
            });

            const labelRadio = document.createElement("label");
            labelRadio.setAttribute('for', radioId)
            labelRadio.innerHTML = starSvg;

            noteRadios.appendChild(inputRadio)
            noteRadios.appendChild(labelRadio)
            li.appendChild(noteRadios)
        }

        ul.appendChild(li);
    }
}

function setNote(id, rating){
    const item = searchs.find(s => s.id === id)
    if (item){
        item.note = rating
    }

    save();
    renderLists();
}

// Init
load();
for (const item of searchs){
    addMarker(item);
    console.log(item);
}
renderLists();

//Events
btn.addEventListener("click", addSearch);
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addSearch();
});


