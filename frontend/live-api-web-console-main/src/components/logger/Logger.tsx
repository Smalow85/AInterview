/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useEffect } from "react";
import { useLoggerStore } from "../../lib/store-logger";
import "./logger.scss";


export default function Logger() {

  useEffect(() => {
    useLoggerStore.getState().fetchMessages();
  }, []);

  const { messages, loading } = useLoggerStore();
  return (
    <div className="logger">
      {loading && <div className="logger-loading">Загрузка...</div>}
      <ul className="logger-list">
        {messages.map((message) => (
          <li key={message.id}>
            <span className="sender">{message.sender}: </span>
            <span className="message">{message.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
