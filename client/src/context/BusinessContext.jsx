import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

export const BusinessContext = createContext();

export const DEFAULT_TEMPLATES = {
  used_car: {
    name: 'Motorwise Dealership',
    business_type: 'used_car',
    icon: '🚗',
    labels: {
      customer: 'Customer',
      lead: 'Lead',
      item: 'Car',
      item_plural: 'Inventory',
      appointment: 'Test Drive',
      appointment_plural: 'Test Drives',
      deal: 'Car Booking & Sale'
    },
    modules: {
      inventory: true,
      appointments: true,
      deals: true
    }
  },
  real_estate: {
    name: 'Prime Realty Estates',
    business_type: 'real_estate',
    icon: '🏢',
    labels: {
      customer: 'Client',
      lead: 'Lead',
      item: 'Property',
      item_plural: 'Properties',
      appointment: 'Site Visit',
      appointment_plural: 'Site Visits',
      deal: 'Property Booking'
    },
    modules: {
      inventory: true,
      appointments: true,
      deals: true
    }
  },
  education: {
    name: 'Apex Academy & Admissions',
    business_type: 'education',
    icon: '🎓',
    labels: {
      customer: 'Student',
      lead: 'Enquiry',
      item: 'Course',
      item_plural: 'Courses',
      appointment: 'Counselling',
      appointment_plural: 'Counselling Sessions',
      deal: 'Admission'
    },
    modules: {
      inventory: true,
      appointments: true,
      deals: true
    }
  },
  service: {
    name: 'ProService Experts',
    business_type: 'service',
    icon: '💼',
    labels: {
      customer: 'Client',
      lead: 'Enquiry',
      item: 'Service',
      item_plural: 'Services',
      appointment: 'Appointment',
      appointment_plural: 'Appointments',
      deal: 'Contract / Job'
    },
    modules: {
      inventory: true,
      appointments: true,
      deals: true
    }
  },
  general_sales: {
    name: 'Global B2B Sales',
    business_type: 'general_sales',
    icon: '📈',
    labels: {
      customer: 'Account / Contact',
      lead: 'Lead',
      item: 'Product',
      item_plural: 'Products',
      appointment: 'Meeting',
      appointment_plural: 'Meetings',
      deal: 'Deal'
    },
    modules: {
      inventory: true,
      appointments: true,
      deals: true
    }
  }
};

export function BusinessProvider({ children }) {
  const [business, setBusiness] = useState(DEFAULT_TEMPLATES.used_car);
  const [availableTemplates, setAvailableTemplates] = useState(DEFAULT_TEMPLATES);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBusiness = async () => {
    try {
      const data = await api('/api/business/current');
      if (data.business) {
        setBusiness(data.business);
      }
      if (data.available_templates) {
        setAvailableTemplates({ ...DEFAULT_TEMPLATES, ...data.available_templates });
      }
    } catch (err) {
      console.error('Failed to load business config:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const userList = await api('/api/users');
      if (Array.isArray(userList) && userList.length > 0) {
        setUsers(userList);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  useEffect(() => {
    fetchBusiness();
    fetchUsers();
  }, []);

  const switchTemplate = async (business_type) => {
    try {
      const res = await api('/api/business/template', {
        method: 'PUT',
        body: { business_type }
      });
      if (res.business) {
        setBusiness(res.business);
        window.dispatchEvent(new CustomEvent('crm-toast', { 
          detail: `Switched business template to: ${res.business.name}` 
        }));
      }
    } catch (err) {
      console.error('Failed to switch template:', err);
      // Fallback local update
      if (DEFAULT_TEMPLATES[business_type]) {
        setBusiness(DEFAULT_TEMPLATES[business_type]);
      }
    }
  };

  const labels = business.labels || DEFAULT_TEMPLATES.used_car.labels;
  const modules = business.modules || DEFAULT_TEMPLATES.used_car.modules;

  return (
    <BusinessContext.Provider value={{
      business,
      labels,
      modules,
      templates: availableTemplates,
      switchTemplate,
      users,
      loading
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    return {
      business: DEFAULT_TEMPLATES.used_car,
      labels: DEFAULT_TEMPLATES.used_car.labels,
      modules: DEFAULT_TEMPLATES.used_car.modules,
      templates: DEFAULT_TEMPLATES,
      switchTemplate: () => {},
      users: []
    };
  }
  return context;
}
