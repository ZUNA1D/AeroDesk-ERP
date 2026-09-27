import React, { useState } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { InputField } from '../ui/InputField.jsx';
import { Button } from '../ui/Button.jsx';
import { clientsApi } from '../../api/clients.api.js';
import { airlinesApi } from '../../api/airlines.api.js';
import { sectorsApi } from '../../api/sectors.api.js';

export function QuickAddClientModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError('');
      const data = await clientsApi.create({ name, phone, email });
      onCreated(data.client);
      setName('');
      setPhone('');
      setEmail('');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Add Client" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
            {error}
          </div>
        )}
        <InputField
          label="Client Full Name *"
          required
          placeholder="e.g. MR. SHAHEDUL ISLAM"
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase())}
          autoFocus
        />
        <InputField
          label="Phone Number"
          placeholder="e.g. +880 1711-000000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <InputField
          label="Email Address"
          type="email"
          placeholder="e.g. client@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Client
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function QuickAddAirlineModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [iataCode, setIataCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError('');
      const data = await airlinesApi.create({ name, iataCode });
      onCreated(data.airline);
      setName('');
      setIataCode('');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Add Airline" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
            {error}
          </div>
        )}
        <InputField
          label="Airline Name *"
          required
          placeholder="e.g. SINGAPORE AIRLINES"
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase())}
          autoFocus
        />
        <InputField
          label="IATA Code"
          placeholder="e.g. SQ"
          value={iataCode}
          onChange={(e) => setIataCode(e.target.value.toUpperCase())}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Airline
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function QuickAddSectorModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError('');
      const data = await sectorsApi.create({ name, origin, destination });
      onCreated(data.sector);
      setName('');
      setOrigin('');
      setDestination('');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Add Sector / Country" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
            {error}
          </div>
        )}
        <InputField
          label="Sector Name / Route *"
          required
          placeholder="e.g. DAC - KUL (DHAKA TO KUALA LUMPUR)"
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase())}
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Origin (Airport/City)"
            placeholder="DAC"
            value={origin}
            onChange={(e) => setOrigin(e.target.value.toUpperCase())}
          />
          <InputField
            label="Destination"
            placeholder="KUL"
            value={destination}
            onChange={(e) => setDestination(e.target.value.toUpperCase())}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Sector
          </Button>
        </div>
      </form>
    </Modal>
  );
}
