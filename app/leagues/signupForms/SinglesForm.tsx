// app/leagues/signupForms/SinglesForm.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { isValidEmail, formatPhoneNumber, isValidPhoneNumber } from '@/utils/formHelpers';

interface SignupSettings {
  id: string;
  name: string;
  signup_start: string;
  signup_close: string;
  league_info: string | null;
  form_type: string;
}

interface LeagueDetails {
  id: string;
  name: string;
  cost_per_player: number;
  sanction_fee: number;
  cap_details: string;
  day_of_week: string;
  start_time: string;
  signup_settings_id: string | null;
}

interface Location {
  id: number;
  name: string;
  league: boolean;
  league_note: string | null;
}

interface SinglesFormData {
  player_name: string;
  adl_number: string;
  email: string;
  phone_number: string;
  paid_nda: boolean; // always true for "no NDA fee"
  league_details_id: string; // FK like DoublesForm
  home_location_1: string;
  home_location_2: string;
  play_preference: string;
  total_fees_due: number;
  payment_method: string;
  signup_settings_id: string;
}

interface SinglesFormProps {
  signup: SignupSettings;
  leagueDetails: LeagueDetails[];
  onSubmitSuccess?: () => void;
}

const SinglesForm: React.FC<SinglesFormProps> = ({
  signup,
  leagueDetails,
  onSubmitSuccess,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [formData, setFormData] = useState<SinglesFormData>({
    player_name: '',
    adl_number: '',
    email: '',
    phone_number: '',
    paid_nda: true, // no NDA fee for singles
    league_details_id: '',
    home_location_1: '',
    home_location_2: '',
    play_preference: 'Either',
    total_fees_due: 0,
    payment_method: '',
    signup_settings_id: signup.id,
  });
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTime12h = (t?: string | null) => {
    if (!t) return '';
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return t ?? '';
    let h = Number(m[1]);
    const minutes = m[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const labelForLeague = (l: LeagueDetails) =>
    `${l.name} - ${l.cap_details} ${l.day_of_week} ${formatTime12h(l.start_time)}`;

  const labelForLocation = (loc: Location) =>
    loc.league_note ? `${loc.name} — ${loc.league_note}` : loc.name;

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, league, league_note')
        .eq('league', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching locations:', error);
      } else {
        setLocations(data as Location[]);
      }
    };

    fetchLocations();
  }, []);

  // Recalculate fees whenever league changes
  useEffect(() => {
    const selected =
      leagueDetails.find((l) => l.id === formData.league_details_id) || null;

    if (!selected) {
      setFormData((prev) => ({ ...prev, total_fees_due: 0 }));
      return;
    }

    // Singles: just the player league fee, no NDA fee
    const totalFees = selected.cost_per_player;
    setFormData((prev) => ({ ...prev, total_fees_due: totalFees }));
  }, [formData.league_details_id, leagueDetails]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, value, type, checked, name } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [type === 'radio' ? name : id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, email: value }));
    setEmailError(value && !isValidEmail(value) ? 'Invalid email format' : '');
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPhoneNumber(value);
    setFormData((prev) => ({ ...prev, phone_number: formatted }));
    setPhoneError(
      !isValidPhoneNumber(formatted) && formatted.length > 0
        ? 'Phone number must be 10 digits'
        : '',
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    setIsSubmitting(true);

    if (!formData.league_details_id) {
      setSubmissionError('Please select a league.');
      setIsSubmitting(false);
      return;
    }

    if (emailError || !isValidPhoneNumber(formData.phone_number)) {
      setSubmissionError('Please correct any email or phone number errors.');
      setIsSubmitting(false);
      return;
    }

    // Build object that matches league_signups schema (like DoublesForm)
    const submissionData = {
      team_name: `${formData.player_name} (Solo)`,
      captain_name: formData.player_name,
      captain_adl_number: formData.adl_number,
      captain_email: formData.email,
      captain_phone_number: formData.phone_number,
      captain_paid_nda: formData.paid_nda,
      teammate_name: '',
      teammate_adl_number: '',
      teammate_email: '',
      teammate_phone_number: '',
      teammate_paid_nda: false,
      league_details_id: formData.league_details_id,
      home_location_1: formData.home_location_1,
      home_location_2: formData.home_location_2,
      play_preference: formData.play_preference,
      total_fees_due: formData.total_fees_due,
      payment_method: formData.payment_method,
      signup_settings_id: formData.signup_settings_id,
    };

    const { error } = await supabase
      .from('league_signups')
      .insert([submissionData]);

    if (error) {
      console.error('Submission error:', error.message);
      setSubmissionError(
        'There was an error submitting your form. Please try again.',
      );
      setIsSubmitting(false);
      return;
    }

    setIsSubmitted(true);
    onSubmitSuccess?.();

    setTimeout(() => {
      const encodedPlayerName = encodeURIComponent(
        `League Signup: ${formData.player_name}`,
      );
      const paymentUrl =
        formData.payment_method === 'Venmo'
          ? `https://venmo.com/behemothdc?txn=pay&amount=${formData.total_fees_due.toFixed(
              2,
            )}&note=${encodedPlayerName}`
          : `https://paypal.me/behemothdc/${formData.total_fees_due.toFixed(
              2,
            )}?currencyCode=USD&note=${encodedPlayerName}`;
      window.open(paymentUrl, '_blank');
    }, 3000);
  };

  const selectedLeague =
    leagueDetails.find((l) => l.id === formData.league_details_id) || null;

  return (
    <div className="flex justify-center">
      {isSubmitted ? (
        <div className="space-y-4 w-full md:max-w-2xl text-center">
          <h3 className="text-[var(--text-highlight)]">
            Signup Submitted Successfully!
          </h3>
          <p>
            Redirecting to {formData.payment_method} in 3 seconds to complete
            your payment of{' '}
            <strong>${formData.total_fees_due.toFixed(2)}</strong>.
          </p>
          <p>
            Not redirected?{' '}
            <a
              href={
                formData.payment_method === 'Venmo'
                  ? `https://venmo.com/behemothdc?txn=pay&amount=${formData.total_fees_due.toFixed(
                      2,
                    )}&note=${encodeURIComponent(
                      `League Signup: ${formData.player_name}`,
                    )}`
                  : `https://paypal.me/behemothdc/${formData.total_fees_due.toFixed(
                      2,
                    )}?currencyCode=USD&note=${encodeURIComponent(
                      `League Signup: ${formData.player_name}`,
                    )}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-highlight)] underline"
            >
              Click here
            </a>
            .
          </p>
          <p>It is safe to close this window after submitting payment.</p>
          <div className="flex justify-center mb-4">
            <svg
              className="animate-spin h-5 w-5 text-[var(--text-highlight)]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>
      ) : (
        <form className="space-y-4 w-full md:max-w-2xl" onSubmit={handleSubmit}>
          <div className="mb-6 p-4 bg-[var(--card-background)] rounded-md text-sm">
            <h3 className="text-[var(--text-highlight)] mb-2">
              {signup.name}
            </h3>
            <div
              dangerouslySetInnerHTML={{ __html: signup.league_info || '' }}
            />
          </div>

          <h3 className="font-bold">Player Information</h3>
          <div>
            <label
              htmlFor="player_name"
              className="block text-sm font-medium"
            >
              Player Name
            </label>
            <input
              type="text"
              id="player_name"
              required
              className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
              value={formData.player_name}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label htmlFor="adl_number" className="block text-sm font-medium">
              ADL Number
            </label>
            <input
              type="text"
              id="adl_number"
              required
              className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
              value={formData.adl_number}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleEmailChange}
              required
              className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
            />
            {emailError && (
              <p className="text-red-500 text-sm">{emailError}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="phone_number"
              className="block text-sm font-medium"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone_number"
              value={formData.phone_number}
              onChange={handlePhoneNumberChange}
              required
              className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
            />
            {phoneError && (
              <p className="text-red-500 text-sm">{phoneError}</p>
            )}
          </div>
          <div className="items-center flex">
            <input
              type="checkbox"
              id="paid_nda"
              checked={formData.paid_nda}
              disabled={true}
              className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-sm checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
            />
            <label htmlFor="paid_nda">
              There is no NDA sanction fee for this league.
            </label>
          </div>

          <h3 className="font-bold">League Selection</h3>
          <div>
            <label
              htmlFor="league_details_id"
              className="block text-sm font-medium"
            >
              What league are you playing in?
            </label>
            <select
              id="league_details_id"
              value={formData.league_details_id}
              onChange={handleInputChange}
              required
              className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
            >
              <option value="">Select a league</option>
              {leagueDetails.map((league) => (
                <option key={league.id} value={league.id}>
                  {labelForLeague(league)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="home_location_1"
              className="block text-sm font-medium"
            >
              Home Location 1st Choice
            </label>
            <select
              id="home_location_1"
              value={formData.home_location_1}
              onChange={handleInputChange}
              required
              className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
            >
              <option value="">Select a location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.name}>
                  {labelForLocation(location)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="home_location_2"
              className="block text-sm font-medium"
            >
              Home Location 2nd Choice
            </label>
            <select
              id="home_location_2"
              value={formData.home_location_2}
              onChange={handleInputChange}
              required
              className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
            >
              <option value="">Select a location</option>
              {locations
                .filter(
                  (location) => location.name !== formData.home_location_1,
                )
                .map((location) => (
                  <option key={location.id} value={location.name}>
                    {labelForLocation(location)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">
              I prefer to play
            </label>
            <div className="mt-1 flex gap-8">
              <div className="items-center flex">
                <input
                  type="radio"
                  id="remote"
                  name="play_preference"
                  value="Remote"
                  required
                  className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-full checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                  onChange={handleInputChange}
                  checked={formData.play_preference === 'Remote'}
                />
                <label htmlFor="remote">Remote</label>
              </div>
              <div className="items-center flex">
                <input
                  type="radio"
                  id="inPerson"
                  name="play_preference"
                  value="In-person"
                  required
                  className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-full checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                  onChange={handleInputChange}
                  checked={formData.play_preference === 'In-person'}
                />
                <label htmlFor="inPerson">In-person</label>
              </div>
              <div className="items-center flex">
                <input
                  type="radio"
                  id="either"
                  name="play_preference"
                  value="Either"
                  required
                  className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-full checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                  onChange={handleInputChange}
                  checked={formData.play_preference === 'Either'}
                />
                <label htmlFor="either">Either</label>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-[var(--card-background)] rounded-md text-sm">
            <p>I understand that I will have to pay upon completion of this form.</p>
            {selectedLeague && (
              <>
                <p className="mt-2">Sign Up Fees:</p>
                <ul className="list-disc list-inside">
                  <li>
                    Player League Fee:{' '}
                    <strong>
                      ${selectedLeague.cost_per_player.toFixed(2)}
                    </strong>
                  </li>
                </ul>
                <p className="mt-2">Fees Due:</p>
                <ul className="list-disc list-inside">
                  <li>
                    Total:{' '}
                    <strong>
                      ${formData.total_fees_due.toFixed(2)}
                    </strong>
                  </li>
                </ul>
              </>
            )}
            <hr />
            <p>This league is ADL, NDA, and NADO sanctioned.</p>
            <p>
              I understand that I must abide by the{' '}
              <a
                href="http://actiondartleague.com/AutoRecovery_save_of_ADL_Rules_and_Guidelines-Player_Handbook-NEW-Updated.pdf"
                target="_blank"
                rel="noreferrer"
              >
                league rules
              </a>
              , and failure to do so may result in disqualification for the
              season and future leagues.
            </p>
            <p>I am aware that this is a 6-week league.</p>
            <p>Matches must be played in the week that they are scheduled.</p>
            <p>There are no substitutions for this league.</p>
            <p>It is my responsibility to find a suitable substitute player.</p>
            <p className="mb-2">NO REFUNDS AFTER SIGN-UPS CLOSE</p>
            <p className="mt-4 mb-0 text-[var(--text-highlight)]">
              <span className="font-bold">
                Entire fees are due at the time of sign-up.
              </span>
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="terms"
              required
              className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-sm checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
              checked={isTermsChecked}
              onChange={() => setIsTermsChecked(!isTermsChecked)}
            />
            <label htmlFor="terms" className="text-sm font-medium">
              I agree to the terms provided above
            </label>
          </div>

          <h3 className="font-bold">Payment Method</h3>
          <div>
            <div className="mt-1 flex gap-8">
              <div className="items-center flex">
                <input
                  type="radio"
                  id="venmo"
                  name="payment_method"
                  value="Venmo"
                  required
                  className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-full checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                  onChange={handleInputChange}
                  checked={formData.payment_method === 'Venmo'}
                />
                <label htmlFor="venmo">Venmo</label>
              </div>
              <div className="items-center flex">
                <input
                  type="radio"
                  id="paypal"
                  name="payment_method"
                  value="Paypal"
                  required
                  className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-full checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                  onChange={handleInputChange}
                  checked={formData.payment_method === 'Paypal'}
                />
                <label htmlFor="paypal">Paypal</label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full p-2 text-white bg-[var(--button-background)] rounded-md ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Submit
          </button>
          {submissionError && (
            <div className="text-red-500 text-center mb-4">
              {submissionError}
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default SinglesForm;
