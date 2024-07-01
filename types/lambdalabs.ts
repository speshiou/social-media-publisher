interface Region {
  name: string
  description: string
}

interface GpuInstanceType {
  name: string
  description: string
  gpu_description: string
  price_cents_per_hour: number
  specs: {
    vcpus: number
    memory_gib: number
    storage_gib: number
    gpus: number
  }
}

type InstanceStatus = 'booting' | 'active' | 'terminating'

interface Instance {
  id: string
  name: string
  ip: string
  status: InstanceStatus
  ssh_key_names: string[]
  file_system_names: string[]
  region: Region
  instance_type: GpuInstanceType
  hostname: string
  jupyter_token: string
  jupyter_url: string
}

interface ListInstancesResult {
  data: Instance[]
}
