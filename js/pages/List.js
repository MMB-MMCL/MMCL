//code for search bar by aezl

import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
  data: () => ({
    list: [],
    editors: [],
    loading: true,
    selected: 0,
    errors: [],
    searchQuery: "",
    roleIconMap,
    store,
  }),
  computed: {
    filteredList() {
      if (!this.searchQuery) return this.list;
      return this.list.filter(([level, err]) => {
        if (!level || !level.name) return false;
        return level.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      });
    },
      faceImage() {
        const face = this.selectedLevel?.face;
    
        if (!face) return "";
    
        if (["1", "2", "3", "4", "5"].includes(String(face))) {
            return "";
        }
    
        return `/assets/Demons/${face}.png`;
    },
    selectedLevel() {
      return this.filteredList[this.selected]
        ? this.filteredList[this.selected][0]
        : null;
    },
    // Compute the original rank (index) in the full list for display purposes.
    selectedIndexInFullList() {
      if (!this.selectedLevel) return this.selected + 1;
      return (
        this.list.findIndex(
          (item) => item[0] && item[0].id === this.selectedLevel.id
        ) + 1
      );
    },
  },
  watch: {
    // Reset the selected index when the search query changes.
    searchQuery() {
      this.selected = 0;
    },
  },
  methods: {
    embed,
    score,
    getOriginalRank(level) {
      let index = this.list.findIndex(
        (item) => item[0] && item[0].id === level.id
      );
      return index >= 0 ? index + 1 : this.selected + 1;
    },
  },
  async mounted() {
    this.list = await fetchList();
    this.editors = await fetchEditors();
    if (!this.list) {
      this.errors = [
        "Failed to load list. Retry in a few minutes or notify list staff.",
      ];
    } else {
      this.errors.push(
        ...this.list
          .filter(([_, err]) => err)
          .map(([_, err]) => `Failed to load level. (${err}.json)`)
      );
      if (!this.editors) {
        this.errors.push("Failed to load list editors.");
      }
    }
    this.loading = false;
  },
  template: `
    <main v-if="loading">
      <Spinner></Spinner>
    </main>
    <main v-else class="page-list">
      <div class="list-container">
        <!-- Search Bar -->
        <div class="search-bar">
          <input type="text" v-model="searchQuery" placeholder="Search levels..." />
        </div>
        <table class="list" v-if="filteredList.length">
          <tr v-for="(item, i) in filteredList" :key="i">
            <td class="rank">
              <p v-if="getOriginalRank(item[0]) <= 100" class="type-label-lg">
                #{{ getOriginalRank(item[0]) }}
              </p>
              <p v-else class="type-label-lg">Legacy</p>
            </td>
            <td class="level" :class="{ 'active': selected === i, 'error': !item[0] }">
              <button @click="selected = i">
                <span class="type-label-lg">
                  {{ item[0]?.name || \`Error (\${item[1]}.json)\` }}
                </span>
              </button>
            </td>
          </tr>
        </table>
        <p v-if="filteredList.length === 0">No levels match your search.</p>
      </div>
      <div class="level-container" v-if="selectedLevel">
        <div class="level">
         <div class="level-header">
            <img
                v-if="faceImage"
                class="demon-face"
                :src="faceImage"
                :alt="selectedLevel.name"
            >
        
            <h1>
                {{ selectedLevel.name }}
            </h1>
        </div>
          <LevelAuthors :author="selectedLevel.author" :creators="selectedLevel.creators" :verifier="selectedLevel.verifier"></LevelAuthors>
          <iframe class="video" id="videoframe" :src="embed(selectedLevel.showcase || selectedLevel.verification)" frameborder="0"></iframe>
          <ul class="stats">
            <li>
              <div class="type-title-sm">Points when completed</div>
              <p>
                {{
                  score(getOriginalRank(selectedLevel), 100, selectedLevel.percentToQualify)
                }}
              </p>
            </li>
            <li>
              <div class="type-title-sm">ID</div>
              <p>{{ selectedLevel.id }}</p>
            </li>
          </ul>
          <h2>Records</h2>
          <p v-if="selectedIndexInFullList <= 75">
            <strong>{{ selectedLevel.percentToQualify }}%</strong> or better to qualify
          </p>
          <p v-else-if="selectedIndexInFullList <= 150">
            <strong>100%</strong> or better to qualify
          </p>
          <p v-else>This level does not accept new records.</p>
          <table class="records">
            <tr v-for="record in selectedLevel.records" class="record">
              <td class="percent">
                <p>{{ record.percent }}%</p>
              </td>
              <td class="user">
                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
              </td>
              <td class="mobile">
                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
              </td>
              <td>
                <p>{{ record.hz }}</p>
              </td>
            </tr>
          </table>
        </div>
      </div>
      <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
        <p>(ノಠ益ಠ)ノ彡┻━┻</p>
      </div>
      <div class="meta-container">
        <div class="meta">
          <div class="errors" v-show="errors.length > 0">
            <p class="error" v-for="error of errors">{{ error }}</p>
          </div>
          <div class="og">
            <p class="type-label-md">
              Website layout made by
              <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a>
            </p>
          </div>
          <template v-if="editors">
            <h3>List Editors</h3>
            <ol class="editors">
              <li v-for="editor in editors" :key="editor.name">
                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                <p v-else>{{ editor.name }}</p>
              </li>
            </ol>
                    </template>
                    <h3>RULES FOR THE CHALLENGE LIST</h3>
                    <p>
                        no exploiting of any kind // obviously, literally anything like macros, hitbox multiplier, noclip are all bannable offenses, and if you get caught cheating you will immediately get banned from the list with no further exceptions.
                    </p>
                    <p>
                       ALSO, on another note for the same rule, IF you were caught cheating of any kind in any other list, you will be banned on this list aswell.
                    </p>
                    <p>
                       recordings // all completions must have audible clicks in them, and the attempt prior to completion, also you have to include you hitting the end wall, aswell as the level complete menu at the end of the completion for it to be legitimate.
                    </p>
                    <p>
                        FPS // NO odd fps' are allowed (unless its your native monitor refresh rate.), so just use the standard FPS (60, 120, 144, 180, 240, CBF).
                    </p>
                    <p>
                        secret ways // you have to use the verifiers path of completion, unless its a multiple choice challenge. i.e no secret ways, no swag routes, etc.
                    </p>
                    <p>
                        level // the completion has to be on an unmodified version of the level.
                    </p>
                    <p>
                        indicator // you must have cheat indicator on for the entire run, UNLESS your playing on vanilla GD (no mods)
                    </p>
                    <p>
                        length // i didnt think id have to write this, but if it wasnt already obvious, your level has to be in the "challenge list level length" which is ranging from 0 seconds, to 29 seconds, so any level thats "medium" length or more will not be accepted on this list. this also includes times from endscreens and not when gp/clicks stop. the only exception is if the completion animation takes time that extends your level, since this cannot be helped. estimators may decide if a level of that category is acceptable or not for the list.
                    </p>
                    <p>
                        age // also if the level is older than "dihhspace"s id of "130638150" it will be denied, since dihhspace was created the day the list was created, this gives a good estimation on how old a level can be 
                    </p>
                    
                    <h3>LEVEL STANDARDS</h3>
                    <p>
                        the standard/minimum for a level would be the quality of "PLEASE PLEASE SPEED" or "EXIT PATH". so go to those levels if you want an estimation of what the quality standard is for a level on the MMCL.
                    </p>
                    <p>
                        (basically, just have structured gameplay.)
                    </p>
                    <p>
                       CPS // levels cannot have more than 9 CPS.
                    </p>
                    <p>
                       consistency // the level CAN have some kind of consistency gameplay, HOWEVER, it cannot be the hardest part of the level and cant take up majority of the level
                    </p>
                    <p>
                        (majority is pretty vague, but estimators will have a poll on which levels containing consistency should be allowed or not, but if your level just has alot of it, it probably wont go to poll stages and will get denied immediately.)
                    </p>
                    <p>
                        framelocked // your level cant be framelocked, as in it shouldnt ONLY be possible on one single FPS, (60 only, for example).
                    </p>
                    <p>
                        copying // obviously, you cant copy/steal gameplay from a different level, doesnt really matter if its rated or not. you can (in some cases) use it as background deco if your making slop (like the devil vortex saws for example) but other then that its deniable. estimators may judge on the levels acceptability depending on the situation. 

                    </p>
                    <p>
                        Fire Rate // "Fire Rate" is a newer rule to stop either newer members of the challenge list, or people with alot of older challenges to mass inflate the list. this rule makes it so you are only allowed to submit 4 challenges to the challenge list per changelog, and exceeding that limit, your levels will be "rate limited" or denied, due to already having 4 existing levels on the pending list. this will prevent mass submission and prevents me from doing more work ;)
                    </p>
                </div>
            </div>
        </main>
    `,
};
