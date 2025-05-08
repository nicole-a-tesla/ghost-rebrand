import { useState } from 'react';

export default function RebrandForm() {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    siteUrl: '',
    apiKey: '',
    newName: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const { siteUrl, apiKey, newName } = formData;

    if (!siteUrl || !apiKey || !newName) {
      setError('All fields are required');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/rebrand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteUrl, apiKey, newName }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error('Error:', error);
      setError(`An error occurred: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Ghost Rebranding Tool</h1>


      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ghost Site URL</label>
          <input
            type="url"
            name="siteUrl"
            value={formData.siteUrl}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="https://yoursite.ghost.io"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Admin API Key</label>
          <input
            type="password"
            name="apiKey"
            value={formData.apiKey}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="your-api-key"
          />
          <p className="text-xs text-gray-500 mt-1">
            From Ghost Admin &gt; Settings &gt; Integrations
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">New Name</label>
          <input
            type="text"
            name="newName"
            value={formData.newName}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="New Name"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
      </form>
    </div>
  );

}