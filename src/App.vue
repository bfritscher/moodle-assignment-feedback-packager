<template>
  <div id="app">
    <header>
      <section class="container grid-960">
        <nav class="navbar">
          <section class="navbar-section">
            <a href="#" class="navbar-brand mr-10">Moodle Assignment Feedback Packager</a>
            <a href="https://github.com/picturepan2/spectre" class="btn btn-link">GitHub</a>
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
        <p v-for="e in csv.errors">
          <strong>{{e.type}} (row: {{e.row}}):</strong> {{e.message}}.</p>
      </div>
      <div class="toast" v-if="incomingFiles.length > 0 && !csv.meta">
        Downloaded incoming files for you: {{incomingFiles.join(', ')}}
      </div>
      <div class="empty file-drop-area" :class="{'is-active': csvDropActive}" v-show="!csv.meta">
        <div class="empty-icon">
          <i class="icon icon-upload"></i>
        </div>
        <h4 class="empty-title">No CSV file uploaded</h4>
        <p class="empty-subtitle">Drag and drop a CSV file here, or click the button.</p>
        <div class="empty-action">
          <button class="btn btn-primary">Choose file</button>
          <input class="file-input" type="file" ref="fileInput" accept=".csv, text/csv" @change="parse" @dragleave="csvDropActive=false" @blur="csvDropActive=false" @drop="csvDropActive=false" @dragenter="csvDropActive=true" @focus="csvDropActive=true" @click="csvDropActive=true">
        </div>
      </div>
      <div v-if="csv.meta">

        <ul class="tab tab-block">
          <li class="tab-item">
            <a href="#" class="badge" :data-badge="filteredGroups.length" @click.prevent="activeTab = 'G'" :class="{active: activeTab === 'G'}">Groups</a>
          </li>
          <li class="tab-item">
            <a href="#" class="badge" :data-badge="files.length" @click.prevent="activeTab = 'F'" :class="{active: activeTab === 'F'}">Feedback Files</a>
          </li>
          <li class="tab-item">
            <a href="#" class="badge" :data-badge="filteredStudents.length" @click.prevent="activeTab = 'S'" :class="{active: activeTab === 'S'}">Participants</a>
          </li>
          <li class="tab-item tab-action ml-10">
            <div class="input-group input-inline">
              <button class="btn btn-primary input-group-btn ml-10 mr-10" @click="unparse">Download CSV</button>
              <button class="btn btn-primary input-group-btn " @click="zip">Download ZIP</button>
            </div>
          </li>
        </ul>

        <section v-show="activeTab === 'G'">
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th>Group</th>
                <th>Grade</th>
                <th>Feedback comments</th>
                <th>Action</th>
                <th>File</th>
              </tr>
            </thead>
            <transition-group name="list" tag="tbody">
              <tr v-for="(group, $index) in filteredGroups" :key="group">
                <td>
                  <a href="#" @click.prevent="filterGroup(group)">{{group}}</a>
                </td>
                <td>
                  <input class="grade" v-model="groups[group].Grade" type="number" @keyup="updateGroupField($event, group, 'Grade')">
                </td>
                <td>
                  <textarea class="feedback" v-model="groups[group]['Feedback comments']" @keyup="updateGroupField($event, group, 'Feedback comments')"></textarea>
                </td>
                <td>
                  <button class="btn" @click="groupFillDownFrom($index)">
                    <i class="icon icon-downward"></i> Fill down</button>
                </td>
                <td>
                  {{filenameForGroup(group)}}
                </td>
              </tr>
            </transition-group>
          </table>
          <div class="form-group">
            <label class="form-label" for="import">Import values group, grade, comment (no header, copy past from Excel or CSV)</label>
            <textarea class="form-input" id="import" placeholder="A01, 1, " rows="3" v-model="groupsImportData"></textarea>
          </div>
          <button class="btn btn-primary" @click="importGroupFeedback">Import</button>
        </section>

        <section v-show="activeTab === 'F'">
          <div class="empty file-drop-area" :class="{'is-active': csvDropActive}">
            <div class="empty-icon">
              <i class="icon icon-upload"></i>
            </div>
            <h4 class="empty-title">Drag and drop feedback files or a zip with files</h4>
            <p class="empty-subtitle">The feeback file should include the name of a group to be matched.</p>
            <div class="empty-action">
              <button class="btn btn-primary">Choose file</button>
              <input class="file-input" type="file" ref="feedbackInput" multiple @change="handleFeedbackFiles" @dragleave="csvDropActive=false" @blur="csvDropActive=false" @drop="csvDropActive=false" @dragenter="csvDropActive=true" @focus="csvDropActive=true" @click="csvDropActive=true">
            </div>
          </div>
          <ul>
            <li v-for="file in files">{{file.name}}</li>
          </ul>

        </section>

        <section v-show="activeTab === 'S'">
          <table v-if="csv.meta" class="table table-striped table-hover">
            <thead>
              <tr>
                <th v-for="field in csv.meta.fields">{{field}}</th>
              </tr>
            </thead>
            <transition-group name="list" tag="tbody">
              <tr v-for="student in filteredStudents" :key="student.Identifier">
                <td v-for="field in csv.meta.fields">
                  <input v-if="isEditableNumber(field)" type="number" v-model="student[field]" min="0" :max="student['Maximum Grade']">
                  <textarea v-else-if="isEditableTextarea(field)" v-model="student[field]"></textarea>
                  <a v-else-if="field === 'Group'" href="#" @click.prevent="filterGroup(student[field])">{{student[field]}}</a>
                  <span v-else>{{student[field]}}</span>
                </td>
              </tr>
            </transition-group>
          </table>
        </section>
      </div>
    </div>
    <div class="modal" :class="{active: showModal}">
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

<script>
import Papa from 'papaparse';
import FileSaver from 'file-saver';
import JSZip from 'jszip';

export default {
  name: 'app',
  data() {
    return {
      csv: {},
      search: '',
      groups: {},
      files: [],
      incomingFiles: [],
      csvDropActive: false,
      showModal: false,
      activeTab: 'G',
      groupsImportData: '',
    };
  },
  mounted() {
    if (window.location.search) {
      const url = window.location.search.split('?url=')[1];
      this.downloadFile(url).then((data) => {
        this.incomingFiles = data;
      });
    }
  },
  computed: {
    filteredStudents() {
      return this.csv.data.filter(student => (
        this.csv.meta.fields.some(field => (
          student[field].toLowerCase().indexOf(this.search.toLowerCase()) > -1
        ))
      ));
    },
    filteredGroups() {
      return Object.keys(this.groups)
        .filter(group => group.toLowerCase().indexOf(this.search.toLowerCase()) > -1).sort();
    },
  },
  methods: {
    reset() {
      this.csv = {};
      this.files = [];
      this.search = '';
    },
    parse() {
      if (this.$refs.fileInput.files.length < 1) {
        this.csv = {};
        this.groups = {};
        return;
      }
      Papa.parse(this.$refs.fileInput.files[0], {
        header: true,
        skipEmptyLines: true,
        complete: (response) => {
          this.csv = response;
          [...new Set(this.csv.data.map(student => student.Group))].forEach((group) => {
            this.$set(this.groups, group, {
              Grade: '',
              'Feedback comments': '',
            });
          });
        },
      });
    },
    importGroupFeedback() {
      Papa.parse(this.groupsImportData, {
        header: false,
        skipEmptyLines: true,
        complete: (response) => {
          response.data.forEach((row) => {
            this.$set(this.groups, row[0], {
              Grade: row[1],
              'Feedback comments': row[2],
            });
          });
        },
      });
    },
    unparse() {
      const csv = Papa.unparse(
        this.csv.data,
        {
          quotes: true,
          newline: this.csv.meta.linebreak,
          delimiter: this.csv.meta.delimiter,
        });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      FileSaver.saveAs(blob, 'out.csv');
    },
    findFile(group) {
      return this.files.find(file => file.name.indexOf(group) > -1);
    },
    filenameForGroup(group) {
      const file = this.findFile(group);
      return file ? file.name : '';
    },
    zip() {
      this.showModal = true;
      const zip = new JSZip();
      this.csv.data.forEach((student) => {
        const file = this.findFile(student.Group);
        if (file) {
          const id = student.Identifier.slice(11);
          const group = student.Group;
          const extension = file.name.split('.').pop();
          zip.file(`${group}_${id}_assignsubmission_file_Feedback-${group}.${extension}`, file);
        }
      });
      zip.generateAsync({ type: 'blob' })
        .then((blob) => {
          FileSaver.saveAs(blob, 'upload.zip');
          this.showModal = false;
        });
    },
    isEditableNumber(field) {
      return ['Grade'].indexOf(field) > -1;
    },
    isEditableTextarea(field) {
      return ['Feedback comments'].indexOf(field) > -1;
    },
    updateGroupField($event, group, field) {
      this.csv.data.forEach((student) => {
        if (student.Group === group) {
          // eslint-disable-next-line
          student[field] = $event.target.value;
        }
      });
    },
    groupFillDownFrom(i) {
      const source = this.groups[this.filteredGroups[i]];
      this.filteredGroups.slice(i + 1).forEach((group) => {
        this.groups[group].Grade = source.Grade;
        this.groups[group]['Feedback comments'] = source['Feedback comments'];
        this.csv.data.forEach((student) => {
          if (student.Group === group) {
            // eslint-disable-next-line
            student.Grade = source.Grade;
            // eslint-disable-next-line
            student['Feedback comments'] = source['Feedback comments'];
          }
        });
      });
    },
    filterGroup(group) {
      if (this.search === group) {
        this.search = '';
      } else {
        this.search = group;
      }
    },
    unzip(file) {
      return JSZip.loadAsync(file)
        .then(zip => (
          Promise.all(Object.values(zip.files).map(zipEntry => (
            zipEntry.async('uint8array').then(content => new File(content, zipEntry.name))
          ))).then(files => this.addFiles(files)))
        , (e) => {
          console.log(e);
        });
    },
    handleFeedbackFiles() {
      this.showModal = true;
      this.addFiles([...this.$refs.feedbackInput.files]).then(() => {
        this.showModal = false;
        this.$refs.feedbackInput.value = null;
      });
    },
    downloadFile(url) {
      if (url.indexOf('http') === 0) {
        return fetch(url, {
          method: 'GET',
        })
          .then(response => response.blob())
          .then((blob) => {
            // eslint-disable-next-line
            blob.lastModifiedDate = new Date();
            // eslint-disable-next-line
            blob.name = url.split('/').pop();
            return this.addFiles([blob]);
          });
      }
      return Promise.resolve([]);
    },
    addFiles(files) {
      return Promise.all(files.map((file) => {
        if (file.name.indexOf('.zip') >= 0) {
          return this.unzip(file);
        }
        if (file.name.indexOf('.json') >= 0) {
          return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = (e) => {
              if (e.error) {
                reject(e.error);
              }
              try {
                Promise.all(JSON.parse(e.target.result)
                .map(url => this.downloadFile(url)))
                .then(fileNames => resolve([].concat(...fileNames)));
              } catch (e2) {
                resolve();
              }
            };
            fr.readAsText(file);
          });
        }
        this.files.push(file);
        return Promise.resolve(file.name);
      })).then(fileNames => [].concat(...fileNames));
    },
  },
};
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
  padding: 1rem .5rem;
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
  padding-left: .6rem;
  padding-right: .6rem;
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
/* .list-leave-active below version 2.1.8 */

{
  opacity: 0;
  transform: translateY(30px);
}
</style>
