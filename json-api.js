import { createStore } from 'redux'
import { jsonApiReducers, metaReducers } from './json-api/reducers'
import * as actions from './json-api/actions'
import addResourceToWindow from './json-api/resource'

const initialMetaState = {
  resource_types: [],
  included_resource_types: []
}

class activeJsonApi {
  constructor (class_name) {
    this.class_name = class_name
    this.meta_store = createStore(metaReducers, initialMetaState)
    this.store = createStore(jsonApiReducers, {})
  }

  reset () {
    actions.resetMetaState(this.meta_store)
    actions.resetState(this.store)
  }

  updateStore (json) {
    actions.storeCanonicalJson(json, this.meta_store)
    this.addObjectKeys()
    this.parseIncludedResourceObjects()
    this.addTopLevelKeysToStore()
    this.updateStoreWithResourceObjects()
    this.addResourcesToWindow()
  }

  addResourcesToWindow() {
    let resource_objects = this.parseResourceObjects()
    resource_objects.forEach(object => {
      object['type'] && addResourceToWindow(object['type'])
    })
  }

  addObjectKeys () {
    let resources = []
    let data = this.meta_store.getState()['canonical_json']['data']
    resources.push(data)
    resources.flatten().forEach(object => {
      object && object['type'] && actions.dispatchPushResourceTypes(object['type'], this.meta_store)
    })
  }

  parseResourceObjects () {
    let resource_objects = []
    let json = this.meta_store.getState()['canonical_json']
    json['data'] && resource_objects.push(json['data'])
    json['included'] && resource_objects.push(...json['included'])
    return resource_objects.flatten()
  }

  updateStoreWithResourceObjects () {
    let resource_objects = this.parseResourceObjects()
    resource_objects.forEach(object => {
      actions.updateOrCreateStoreWithObject(object, this.store)
    })
  }

  parseIncludedResourceObjects () {
    this.meta_store.getState()['canonical_json']['included'] &&
    this.meta_store.getState()['canonical_json']['included'].forEach(object => {
      actions.dispatchIncludedResourceTypes(object['type'], this.meta_store)
    })
  }

  buildStoreKeys () {
    let current_state = this.meta_store.getState()
    let resource_array = new Set(current_state['included_resource_types'])
    resource_array.add(...current_state['resource_types'])
    return [...resource_array]
  }

  addTopLevelKeysToStore () {
    let keys_to_build = this.buildStoreKeys()
    keys_to_build.forEach(key => {
      actions.dispatchAddEmptyKey(key, this.store)
    })
  }

  getObject (object, id) {
    return this.store.getState()[object] &&
      this.store.getState()[object].filter(object => {
        return object['id'] === id
      })[0]
  }

  getAll (type) {
    return this.store.getState()[type]
  }

  getIncludedRelationship (type, relationship_type, parent_id) {
    let resourcesToFilter = this.getAll(type) || []
    return resourcesToFilter.filter(object => {
      return object['relationships'][relationship_type] &&
      object['relationships'][relationship_type]['data'] &&
      object['relationships'][relationship_type]['data']['id'] === parent_id
    })
  }

}

export default activeJsonApi
