const DB_NAME = 'homework-board-db'
const DB_VERSION = 1

export const STORES = {
  HOMEWORKS: 'homeworks',
  HISTORY_RECORDS: 'historyRecords',
  USERS: 'users',
} as const

let dbInstance: IDBDatabase | null = null

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORES.HOMEWORKS)) {
        const homeworkStore = db.createObjectStore(STORES.HOMEWORKS, { keyPath: 'id' })
        homeworkStore.createIndex('studentId', 'studentId', { unique: false })
        homeworkStore.createIndex('status', 'status', { unique: false })
        homeworkStore.createIndex('subject', 'subject', { unique: false })
        homeworkStore.createIndex('assignedAt', 'assignedAt', { unique: false })
        homeworkStore.createIndex('deadline', 'deadline', { unique: false })
        homeworkStore.createIndex('isDeleted', 'isDeleted', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.HISTORY_RECORDS)) {
        const historyStore = db.createObjectStore(STORES.HISTORY_RECORDS, { keyPath: 'id' })
        historyStore.createIndex('homeworkId', 'homeworkId', { unique: false })
        historyStore.createIndex('timestamp', 'timestamp', { unique: false })
        historyStore.createIndex('operatorId', 'operatorId', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.USERS)) {
        const userStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' })
        userStore.createIndex('role', 'role', { unique: false })
        userStore.createIndex('name', 'name', { unique: false })
      }
    }
  })
}

export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

export function addRecord(storeName: string, data: any): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB()
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.add(data)

      request.onsuccess = () => resolve(request.result as string)
      request.onerror = () => reject(request.error)
    } catch (error) {
      reject(error)
    }
  })
}

export function putRecord(storeName: string, data: any): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB()
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve(request.result as string)
      request.onerror = () => reject(request.error)
    } catch (error) {
      reject(error)
    }
  })
}

export function getRecord(storeName: string, id: string): Promise<any | undefined> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB()
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    } catch (error) {
      reject(error)
    }
  })
}

export function getAllRecords(storeName: string): Promise<any[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB()
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    } catch (error) {
      reject(error)
    }
  })
}

export function getAllByIndex(
  storeName: string,
  indexName: string,
  value: any
): Promise<any[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB()
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.getAll(value)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    } catch (error) {
      reject(error)
    }
  })
}

export function deleteRecord(storeName: string, id: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB()
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    } catch (error) {
      reject(error)
    }
  })
}

export function clearStore(storeName: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB()
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    } catch (error) {
      reject(error)
    }
  })
}
