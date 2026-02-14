<template>
  <div id="app">
    <header>
      <section class="container grid-960">
        <nav class="navbar">
          <section class="navbar-section">
            <a href="#" class="navbar-brand mr-10">Moodle Assignment Feedback Packager</a>
            <a
              href="https://github.com/bfritscher/moodle-assignment-feedback-packager"
              class="btn btn-link"
              >GitHub</a
            >
          </section>
          <section class="navbar-section">
            <div class="input-group input-inline">
              <input class="form-input" type="text" placeholder="search" v-model="search" />
              <button class="btn btn-action ml-10" title="reset" @click="reset">
                <i class="icon icon-refresh"></i>
              </button>
            </div>
          </section>
        </nav>
      </section>
    </header>
    <div class="content container grid-960">
      <div class="toast toast-error" v-if="csv.errors && csv.errors.length > 0">
        <p v-for="(e, index) in csv.errors" :key="`error-${index}`">
          <strong>{{ e.type }} (row: {{ e.row }}):</strong> {{ e.message }}.
        </p>
      </div>
      <div class="toast" v-if="incomingFiles.length > 0 && !csv.meta">
        Downloaded incoming files for you: {{ incomingFiles.join(", ") }}
      </div>
      <div class="empty file-drop-area" :class="{ 'is-active': csvDropActive }" v-show="!csv.meta">
        <div class="empty-icon">
          <i class="icon icon-upload"></i>
        </div>
        <h4 class="empty-title">No CSV file uploaded</h4>
        <p class="empty-subtitle">Drag and drop a CSV file here, or click the button.</p>
        <div class="empty-action">
          <button class="btn btn-primary">Choose file</button>
          <input
            class="file-input"
            type="file"
            ref="fileInput"
            accept=".csv, text/csv"
            @change="parse"
            @dragleave="csvDropActive = false"
            @blur="csvDropActive = false"
            @drop="csvDropActive = false"
            @dragenter="csvDropActive = true"
            @focus="csvDropActive = true"
            @click="csvDropActive = true"
          />
        </div>
      </div>
      <div v-if="csv.meta">
        <ul class="tab tab-block">
          <li class="tab-item">
            <a
              href="#"
              class="badge"
              :data-badge="filteredGroups.length"
              @click.prevent="activeTab = 'G'"
              :class="{ active: activeTab === 'G' }"
              >Groups</a
            >
          </li>
          <li class="tab-item">
            <a
              href="#"
              class="badge"
              :data-badge="files.length"
              @click.prevent="activeTab = 'F'"
              :class="{ active: activeTab === 'F' }"
              >Feedback Files</a
            >
          </li>
          <li class="tab-item">
            <a
              href="#"
              class="badge"
              :data-badge="filteredStudents.length"
              @click.prevent="activeTab = 'S'"
              :class="{ active: activeTab === 'S' }"
              >Participants</a
            >
          </li>
          <li class="tab-item tab-action ml-10">
            <div class="input-group input-inline">
              <button class="btn btn-primary input-group-btn ml-10 mr-10" @click="unparse">
                Download CSV
              </button>
              <button class="btn btn-primary input-group-btn" @click="zip">Download ZIP</button>
            </div>
          </li>
        </ul>

        <section v-show="activeTab === 'G'">
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th>{{ langLookup.group }}</th>
                <th>{{ langLookup.grade }}</th>
                <th>{{ langLookup.feedback }}</th>
                <th>Action</th>
                <th>File</th>
              </tr>
            </thead>
            <transition-group name="list" tag="tbody">
              <tr v-for="(group, $index) in filteredGroups" :key="group">
                <td>
                  <a href="#" @click.prevent="filterGroup(group)">{{ group }}</a>
                </td>
                <td>
                  <input
                    class="grade"
                    v-model="groups[group][langLookup.grade]"
                    type="number"
                    @input="
                      updateGroupField(group, langLookup.grade, groups[group][langLookup.grade])
                    "
                  />
                </td>
                <td>
                  <textarea
                    class="feedback"
                    v-model="groups[group][langLookup.feedback]"
                    @input="
                      updateGroupField(
                        group,
                        langLookup.feedback,
                        groups[group][langLookup.feedback],
                      )
                    "
                  ></textarea>
                </td>
                <td>
                  <button class="btn" @click="groupFillDownFrom($index)">
                    <i class="icon icon-downward"></i> Fill down
                  </button>
                </td>
                <td>
                  {{ filenameForGroup(group) }}
                </td>
              </tr>
            </transition-group>
          </table>
          <div class="form-group">
            <label class="form-label" for="import"
              >Import values group, grade, comment (no header, copy past from Excel or CSV)</label
            >
            <textarea
              class="form-input"
              id="import"
              placeholder="A01, 1, "
              rows="3"
              v-model="groupsImportData"
            ></textarea>
          </div>
          <button class="btn btn-primary" @click="importGroupFeedback">Import</button>
        </section>

        <section v-show="activeTab === 'F'">
          <div class="empty file-drop-area" :class="{ 'is-active': csvDropActive }">
            <div class="empty-icon">
              <i class="icon icon-upload"></i>
            </div>
            <h4 class="empty-title">Drag and drop feedback files or a zip with files</h4>
            <p class="empty-subtitle">
              The feedback file should include the name of a group to be matched.
            </p>
            <div class="empty-action">
              <button class="btn btn-primary">Choose file</button>
              <input
                class="file-input"
                type="file"
                ref="feedbackInput"
                multiple
                @change="handleFeedbackFiles"
                @dragleave="csvDropActive = false"
                @blur="csvDropActive = false"
                @drop="csvDropActive = false"
                @dragenter="csvDropActive = true"
                @focus="csvDropActive = true"
                @click="csvDropActive = true"
              />
            </div>
          </div>
          <ul>
            <li v-for="file in files" :key="file.name">{{ file.name }}</li>
          </ul>
        </section>

        <section v-show="activeTab === 'S'" style="overflow: auto">
          <table v-if="csv.meta" class="table table-striped table-hover">
            <thead>
              <tr>
                <th v-for="field in csv.meta.fields" :key="field">{{ field }}</th>
              </tr>
            </thead>
            <transition-group name="list" tag="tbody">
              <tr v-for="student in filteredStudents" :key="student[langLookup.identifier]">
                <td
                  v-for="field in csv.meta.fields"
                  :key="`${student[langLookup.identifier]}-${field}`"
                >
                  <input
                    v-if="isEditableNumber(field)"
                    type="number"
                    v-model="student[field]"
                    min="0"
                    :max="student[langLookup.gradeMax]"
                  />
                  <textarea
                    v-else-if="isEditableTextarea(field)"
                    v-model="student[field]"
                  ></textarea>
                  <a
                    v-else-if="field === langLookup.group"
                    href="#"
                    @click.prevent="filterGroup(student[field])"
                    >{{ student[field] }}</a
                  >
                  <span v-else>{{ student[field] }}</span>
                </td>
              </tr>
            </transition-group>
          </table>
        </section>
      </div>
    </div>
    <div class="modal" :class="{ active: showModal }">
      <div class="modal-overlay"></div>
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">Processing file(s)</div>
        </div>
        <div class="modal-body">
          <div class="loading"></div>
        </div>
        <div class="modal-footer"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Papa from "papaparse";
import FileSaver from "file-saver";
import JSZip from "jszip";
import { computed, onMounted, reactive, ref } from "vue";

const fileInput = ref(null);
const feedbackInput = ref(null);

const lang = {
  en: {
    identifierPrefixLength: 11,
    identifier: "Identifier",
    group: "Group",
    grade: "Grade",
    gradeMax: "Maximum Grade",
    feedback: "Feedback comments",
  },
  fr: {
    identifierPrefixLength: 11,
    identifier: "Identifiant",
    group: "Groupe",
    grade: "Note",
    gradeMax: "Note maximale",
    feedback: "Feedback par commentaires",
  },
};

const search = ref("");
const files = ref([]);
const incomingFiles = ref([]);
const csvDropActive = ref(false);
const showModal = ref(false);
const activeTab = ref("G");
const groupsImportData = ref("");
const selectedLanguage = ref("en");
const groups = reactive({});
const csv = ref({});

const langLookup = computed(() => lang[selectedLanguage.value]);

const filteredStudents = computed(() => {
  if (!csv.value.meta || !Array.isArray(csv.value.data)) {
    return [];
  }
  const normalizedSearch = search.value.toLowerCase();
  return csv.value.data.filter((student) =>
    csv.value.meta.fields.some((field) =>
      String(student[field] ?? "")
        .toLowerCase()
        .includes(normalizedSearch),
    ),
  );
});

const filteredGroups = computed(() => {
  const normalizedSearch = search.value.toLowerCase();
  return Object.keys(groups)
    .filter((group) => group.toLowerCase().includes(normalizedSearch))
    .sort();
});

function clearGroups() {
  Object.keys(groups).forEach((group) => {
    delete groups[group];
  });
}

function reset() {
  csv.value = {};
  files.value = [];
  search.value = "";
  clearGroups();
}

function parse() {
  const selectedFile = fileInput.value?.files?.[0];
  if (!selectedFile) {
    csv.value = {};
    clearGroups();
    return;
  }

  Papa.parse(selectedFile, {
    header: true,
    skipEmptyLines: true,
    complete: (response) => {
      csv.value = response;
      clearGroups();

      const firstField = csv.value?.meta?.fields?.[0];
      const foundLang = Object.keys(lang).find(
        (currentLang) => lang[currentLang].identifier === firstField,
      );
      if (foundLang) {
        selectedLanguage.value = foundLang;
      }

      [...new Set(csv.value.data.map((student) => student[langLookup.value.group]))].forEach(
        (group) => {
          groups[group] = {
            [langLookup.value.grade]: "",
            [langLookup.value.feedback]: "",
          };
        },
      );
    },
  });
}

function updateGroupField(group, field, value) {
  csv.value.data.forEach((student) => {
    if (student[langLookup.value.group] === group) {
      student[field] = value;
    }
  });
}

function importGroupFeedback() {
  Papa.parse(groupsImportData.value, {
    header: false,
    skipEmptyLines: true,
    complete: (response) => {
      response.data.forEach((row) => {
        const group = row[0];
        const grade = row[1];
        const feedback = row[2];
        groups[group] = {
          [langLookup.value.grade]: grade,
          [langLookup.value.feedback]: feedback,
        };
        updateGroupField(group, langLookup.value.grade, grade);
        updateGroupField(group, langLookup.value.feedback, feedback);
      });
    },
  });
}

function unparse() {
  const outputCsv = Papa.unparse(csv.value.data, {
    quotes: true,
    newline: csv.value.meta.linebreak,
    delimiter: csv.value.meta.delimiter,
  });
  const blob = new Blob([outputCsv], { type: "text/csv;charset=utf-8" });
  FileSaver.saveAs(blob, "out.csv");
}

function findFile(group) {
  return files.value.find((file) => file.name.indexOf(group) > -1);
}

function filenameForGroup(group) {
  const file = findFile(group);
  return file ? file.name : "";
}

async function zip() {
  showModal.value = true;
  try {
    const zipFile = new JSZip();
    csv.value.data.forEach((student) => {
      const file = findFile(student[langLookup.value.group]);
      if (file) {
        const id = student[langLookup.value.identifier].slice(
          langLookup.value.identifierPrefixLength,
        );
        const group = student[langLookup.value.group];
        const extension = file.name.split(".").pop();
        zipFile.file(`${group}_${id}_assignsubmission_file_Feedback-${group}.${extension}`, file);
      }
    });
    const blob = await zipFile.generateAsync({ type: "blob" });
    FileSaver.saveAs(blob, "upload.zip");
  } finally {
    showModal.value = false;
  }
}

function isEditableNumber(field) {
  return [langLookup.value.grade].indexOf(field) > -1;
}

function isEditableTextarea(field) {
  return [langLookup.value.feedback].indexOf(field) > -1;
}

function groupFillDownFrom(i) {
  const source = groups[filteredGroups.value[i]];
  filteredGroups.value.slice(i + 1).forEach((group) => {
    groups[group][langLookup.value.grade] = source[langLookup.value.grade];
    groups[group][langLookup.value.feedback] = source[langLookup.value.feedback];
    csv.value.data.forEach((student) => {
      if (student[langLookup.value.group] === group) {
        student[langLookup.value.grade] = source[langLookup.value.grade];
        student[langLookup.value.feedback] = source[langLookup.value.feedback];
      }
    });
  });
}

function filterGroup(group) {
  if (search.value === group) {
    search.value = "";
  } else {
    search.value = group;
  }
}

function unzip(file) {
  return JSZip.loadAsync(file)
    .then((zipObj) =>
      Promise.all(
        Object.values(zipObj.files)
          .filter((zipEntry) => !zipEntry.dir)
          .map((zipEntry) =>
            zipEntry.async("uint8array").then((content) => new File([content], zipEntry.name)),
          ),
      ).then((unzippedFiles) => addFiles(unzippedFiles)),
    )
    .catch((error) => {
      console.log(error);
      return [];
    });
}

async function handleFeedbackFiles() {
  showModal.value = true;
  try {
    await addFiles([...(feedbackInput.value?.files || [])]);
    if (feedbackInput.value) {
      feedbackInput.value.value = null;
    }
  } finally {
    showModal.value = false;
  }
}

function downloadFile(url) {
  if (url.indexOf("http") === 0) {
    return fetch(url, {
      method: "GET",
    })
      .then((response) => response.blob())
      .then((blob) => {
        const fileName = url.split("/").pop() || "downloaded-file";
        const downloadedFile = new File([blob], fileName, {
          type: blob.type || "application/octet-stream",
          lastModified: Date.now(),
        });
        return addFiles([downloadedFile]);
      });
  }
  return Promise.resolve([]);
}

function addFiles(newFiles) {
  return Promise.all(
    newFiles.map((file) => {
      if (file.name.indexOf(".zip") >= 0) {
        return unzip(file);
      }
      if (file.name.indexOf(".json") >= 0) {
        return new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = (event) => {
            if (event.error) {
              reject(event.error);
              return;
            }
            try {
              Promise.all(JSON.parse(event.target.result).map((url) => downloadFile(url))).then(
                (fileNames) => resolve([].concat(...fileNames)),
              );
            } catch {
              resolve([]);
            }
          };
          fr.readAsText(file);
        });
      }
      files.value.push(file);
      return Promise.resolve(file.name);
    }),
  ).then((fileNames) => [].concat(...fileNames));
}

onMounted(() => {
  const url = new URLSearchParams(window.location.search).get("url");
  if (url) {
    downloadFile(url).then((downloadedFiles) => {
      incomingFiles.value = downloadedFiles;
    });
  }
});
</script>

<style>
.file-input {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  cursor: pointer;
  opacity: 0;
}

.file-drop-area {
  position: relative;
}

.is-active {
  background-color: #4c59c2;
}

.empty .icon {
  font-size: 4rem;
}

header {
  padding: 1rem 0.5rem;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 200;
  background: #f8f9fa;
  color: #667189;
}

.content {
  padding: 7rem 0;
}

.navbar-brand {
  color: #50596c;
}

.btn-link {
  color: #667189;
  padding-left: 0.6rem;
  padding-right: 0.6rem;
}

.table td {
  padding: 0 1rem;
}

.grade {
  width: 5rem;
}

.feedback {
  width: 100%;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s;
}

.list-enter,
.list-leave-to
/* .list-leave-active below version 2.1.8 */ {
  opacity: 0;
  transform: translateY(30px);
}
</style>
