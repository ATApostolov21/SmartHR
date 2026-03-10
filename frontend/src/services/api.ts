import axios from "axios"

const API_BASE = "http://localhost:8000/api"

// Intercept responses to catch 401 Unauthorized globally
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear token automatically if rejected by backend
            localStorage.removeItem("access_token")
            localStorage.removeItem("user_role")
            // Quick way to force re-render/redirect to login in simple setups
            if (window.location.pathname !== "/") {
                window.location.reload()
            }
        }
        return Promise.reject(error)
    }
)

export const api = {
    login: async (username: string, password: string) => {
        // FastAPI OAuth2PasswordRequestForm expects form-urlencoded
        const formData = new URLSearchParams()
        formData.append("username", username)
        formData.append("password", password)
        const response = await axios.post(`${API_BASE}/login`, formData, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })
        return response.data
    },
    uploadData: async (file: File) => {
        const formData = new FormData()
        formData.append("file", file)
        const response = await axios.post(`${API_BASE}/upload`, formData)
        return response.data
    },

    previewData: async (file: File) => {
        const formData = new FormData()
        formData.append("file", file)
        const response = await axios.post(`${API_BASE}/upload/preview`, formData)
        return response.data
    },

    getEmployees: async () => {
        const response = await axios.get(`${API_BASE}/employees`)
        return response.data
    },

    getAnalysis: async (id: number) => {
        const response = await axios.get(`${API_BASE}/analysis/${id}`)
        return response.data
    },

    predictSingle: async (data: any) => {
        const response = await axios.post(`${API_BASE}/predict`, data)
        return response.data
    },

    resetData: async () => {
        const response = await axios.post(`${API_BASE}/reset`)
        return response.data
    },

    // Settings
    getOrganization: async () => {
        const response = await axios.get(`${API_BASE}/organization`)
        return response.data
    },

    updateOrganization: async (name: string) => {
        const response = await axios.post(`${API_BASE}/organization`, { organization_name: name })
        return response.data
    },

    // User Management (Admin Only)
    getUsers: async () => {
        const response = await axios.get(`${API_BASE}/users`)
        return response.data
    },

    createUser: async (userData: any) => {
        const response = await axios.post(`${API_BASE}/users`, userData)
        return response.data
    },

    deleteUser: async (userId: number) => {
        const response = await axios.delete(`${API_BASE}/users/${userId}`)
        return response.data
    },

    updateUserStatus: async (userId: number, is_active: boolean) => {
        const response = await axios.patch(`${API_BASE}/users/${userId}/status`, { is_active })
        return response.data
    },

    getDepartments: async () => {
        const response = await axios.get(`${API_BASE}/departments`)
        return response.data
    },

    getDepartmentStats: async () => {
        const response = await axios.get(`${API_BASE}/department/stats`)
        return response.data
    },

    // Analysis History
    getAnalyses: async () => {
        const response = await axios.get(`${API_BASE}/analyses`)
        return response.data
    },

    getAnalysisStats: async (analysisId: number) => {
        const response = await axios.get(`${API_BASE}/analyses/${analysisId}/stats`)
        return response.data
    },

    activateAnalysis: async (analysisId: number) => {
        const response = await axios.patch(`${API_BASE}/analyses/${analysisId}/activate`)
        return response.data
    },

    deleteAnalysis: async (analysisId: number) => {
        const response = await axios.delete(`${API_BASE}/analyses/${analysisId}`)
        return response.data
    },

    getAIInsight: async (data: { employee_id: number; changes: any[]; simulated_risk: number }) => {
        const response = await axios.post(`${API_BASE}/ai-insight`, data)
        return response.data
    },
}
