import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ChatMessage, Conversation, listMessages, openGroupConversation, sendMessage } from '../api/chat';
import { createGroup, EventGroup, joinGroup, listGroups } from '../api/groups';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';
import { Experience } from '../types/experience';

type SocialScreenProps = {
  session: AuthSession;
  experiences: Experience[];
};

const demoGroups: EventGroup[] = [
  {
    id: 'demo-after-office',
    experienceId: 'demo',
    createdByUserId: 'demo',
    createdByEmail: 'eventify@demo.local',
    name: 'After office en Palermo',
    description: 'Grupo para coordinar previa, llegada y vuelta compartida.',
    visibility: 'PUBLIC',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-techno',
    experienceId: 'demo',
    createdByUserId: 'demo',
    createdByEmail: 'eventify@demo.local',
    name: 'Techno BA compatibles',
    description: 'Matching contextual para ir con gente de confianza.',
    visibility: 'PUBLIC',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function SocialScreen({ session, experiences }: SocialScreenProps) {
  const targetExperience = useMemo(() => experiences.find((experience) => isUuid(experience.id)) ?? experiences[0], [experiences]);
  const [groups, setGroups] = useState<EventGroup[]>(demoGroups);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>([]);
  const [activeGroup, setActiveGroup] = useState<EventGroup | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canUseApi = Boolean(targetExperience && isUuid(targetExperience.id));

  useEffect(() => {
    let mounted = true;

    async function fetchGroups() {
      if (!targetExperience || !canUseApi) {
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const nextGroups = await listGroups(session, targetExperience.id);
        if (mounted) {
          setGroups(nextGroups.length > 0 ? nextGroups : []);
        }
      } catch (exception) {
        if (mounted) {
          setError(exception instanceof Error ? exception.message : 'No se pudieron cargar grupos');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchGroups();
    return () => {
      mounted = false;
    };
  }, [canUseApi, session, targetExperience]);

  async function handleCreateGroup() {
    if (!name.trim()) {
      return;
    }

    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      if (!targetExperience || !canUseApi) {
        const demoGroup: EventGroup = {
          ...demoGroups[0],
          id: `demo-${Date.now()}`,
          name: name.trim(),
          description: description.trim() || 'Grupo creado en modo demo.',
        };
        setGroups((currentGroups) => [demoGroup, ...currentGroups]);
        setMessage('Grupo creado en modo demo.');
      } else {
        const nextGroup = await createGroup(
          session,
          targetExperience.id,
          name.trim(),
          description.trim() || 'Coordinacion abierta para esta experiencia.'
        );
        setGroups((currentGroups) => [nextGroup, ...currentGroups]);
        setMessage('Grupo creado para esta experiencia.');
      }
      setName('');
      setDescription('');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo crear el grupo');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinGroup(group: EventGroup) {
    setJoiningId(group.id);
    setError(null);
    setMessage(null);
    try {
      if (canUseApi && targetExperience) {
        await joinGroup(session, targetExperience.id, group.id);
      }
      setJoinedGroupIds((currentIds) => [...new Set([...currentIds, group.id])]);
      setMessage(`Te sumaste a ${group.name}.`);
      await handleOpenChat(group);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo entrar al grupo');
    } finally {
      setJoiningId(null);
    }
  }

  async function handleOpenChat(group: EventGroup) {
    setActiveGroup(group);
    setError(null);
    setMessage(null);

    if (!canUseApi || !targetExperience || !isUuid(group.id)) {
      setConversation(null);
      setMessages(buildDemoMessages(group, session.email));
      return;
    }

    setChatLoading(true);
    try {
      const nextConversation = await openGroupConversation(session, targetExperience.id, group.id);
      const nextMessages = await listMessages(session, nextConversation.id);
      setConversation(nextConversation);
      setMessages(nextMessages);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo abrir el chat');
    } finally {
      setChatLoading(false);
    }
  }

  async function handleSendMessage() {
    const body = draft.trim();
    if (!body || !activeGroup) {
      return;
    }

    setSending(true);
    setError(null);
    try {
      if (!conversation) {
        setMessages((currentMessages) => [
          ...currentMessages,
          buildDemoMessage(activeGroup.id, session.email, body),
        ]);
      } else {
        const nextMessage = await sendMessage(session, conversation.id, body);
        setMessages((currentMessages) => [...currentMessages, nextMessage]);
      }
      setDraft('');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Social</Text>
        <Text style={styles.screenMeta}>
          {targetExperience ? `Grupos para ${targetExperience.title}` : 'Grupos y matching contextual'}
        </Text>
      </View>

      <View style={styles.composer}>
        <Text style={styles.blockTitle}>Crear grupo</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nombre del grupo"
          placeholderTextColor={colors.subtle}
          style={styles.input}
        />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Descripcion corta"
          placeholderTextColor={colors.subtle}
          style={[styles.input, styles.textArea]}
          multiline
        />
        <Pressable
          style={[styles.primaryButton, (!name.trim() || creating) && styles.disabled]}
          onPress={handleCreateGroup}
          disabled={!name.trim() || creating}
        >
          <Ionicons name="add-circle-outline" size={19} color={colors.black} />
          <Text style={styles.primaryButtonText}>{creating ? 'Creando...' : 'Crear grupo'}</Text>
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <SummaryPill icon="people-outline" label={`${groups.length} grupos`} />
        <SummaryPill icon="checkmark-circle-outline" label={`${joinedGroupIds.length} unidos`} />
      </View>

      {loading ? <Text style={styles.metaText}>Cargando grupos...</Text> : null}
      {message ? <Text style={styles.successText}>{message}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {groups.map((group) => {
        const joined = joinedGroupIds.includes(group.id);
        return (
          <Pressable key={group.id} style={styles.socialRow} onPress={() => handleOpenChat(group)}>
            <Ionicons name="chatbubbles-outline" size={26} color={colors.primary} style={styles.socialIcon} />
            <View style={styles.socialText}>
              <Text style={styles.rowTitle}>{group.name}</Text>
              <Text style={styles.rowMeta}>{group.description || 'Coordinacion abierta para asistentes.'}</Text>
              <Text style={styles.rowBadge}>{group.status} - {group.visibility}</Text>
            </View>
            <Pressable
              style={[styles.joinButton, joined && styles.joinedButton]}
              onPress={() => handleJoinGroup(group)}
              disabled={joined || joiningId === group.id}
            >
              <Text style={[styles.joinButtonText, joined && styles.joinedButtonText]}>
                {joined ? 'Dentro' : joiningId === group.id ? '...' : 'Unirme'}
              </Text>
            </Pressable>
          </Pressable>
        );
      })}

      {activeGroup ? (
        <View style={styles.chatPanel}>
          <View style={styles.chatHeader}>
            <View style={styles.chatTitleCopy}>
              <Text style={styles.blockTitle}>{activeGroup.name}</Text>
              <Text style={styles.rowMeta}>{chatLoading ? 'Cargando mensajes...' : `${messages.length} mensajes`}</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={() => setActiveGroup(null)}>
              <Ionicons name="close" size={19} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.messageList}>
            {messages.length > 0 ? (
              messages.map((chatMessage) => {
                const mine = chatMessage.senderEmail === session.email;
                return (
                  <View key={chatMessage.id} style={[styles.messageBubble, mine && styles.messageBubbleMine]}>
                    <Text style={styles.messageSender}>{mine ? 'Vos' : chatMessage.senderEmail}</Text>
                    <Text style={styles.messageBody}>{chatMessage.body}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.metaText}>Todavia no hay mensajes.</Text>
            )}
          </View>

          <View style={styles.messageComposer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Escribir mensaje"
              placeholderTextColor={colors.subtle}
              style={styles.messageInput}
            />
            <Pressable
              style={[styles.sendButton, (!draft.trim() || sending) && styles.disabled]}
              onPress={handleSendMessage}
              disabled={!draft.trim() || sending}
            >
              <Ionicons name="send" size={18} color={colors.black} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function SummaryPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.summaryPill}>
      <Ionicons name={icon} size={17} color={colors.success} />
      <Text style={styles.summaryText}>{label}</Text>
    </View>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function buildDemoMessages(group: EventGroup, email: string): ChatMessage[] {
  return [
    buildDemoMessage(group.id, 'sofia@eventify.demo', 'Llegamos 22:30 y nos encontramos en la puerta.'),
    buildDemoMessage(group.id, email, 'Me sumo, avisen si cambian punto de encuentro.'),
  ];
}

function buildDemoMessage(groupId: string, senderEmail: string, body: string): ChatMessage {
  const now = new Date().toISOString();
  return {
    id: `demo-message-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    conversationId: `demo-conversation-${groupId}`,
    senderUserId: 'demo-user',
    senderEmail,
    body,
    status: 'SENT',
    createdAt: now,
    updatedAt: now,
  };
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 96,
    gap: 12,
    backgroundColor: colors.background,
  },
  header: {
    gap: 5,
  },
  screenTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 0,
  },
  screenMeta: {
    color: colors.muted,
    fontWeight: '800',
    lineHeight: 20,
  },
  composer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  blockTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  input: {
    minHeight: 46,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    color: colors.text,
    paddingHorizontal: 12,
    fontWeight: '800',
  },
  textArea: {
    minHeight: 74,
    paddingTop: 11,
    textAlignVertical: 'top',
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: colors.black,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.55,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryPill: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: colors.successSoft,
    borderColor: '#16533F',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  summaryText: {
    color: colors.success,
    fontWeight: '900',
  },
  socialRow: {
    minHeight: 86,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialIcon: {
    width: 36,
    textAlign: 'center',
  },
  socialText: {
    flex: 1,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  rowMeta: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '700',
  },
  rowBadge: {
    color: colors.primary,
    marginTop: 6,
    fontSize: 11,
    fontWeight: '900',
  },
  joinButton: {
    minHeight: 38,
    minWidth: 74,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  joinedButton: {
    backgroundColor: colors.successSoft,
    borderColor: '#16533F',
    borderWidth: 1,
  },
  joinButtonText: {
    color: colors.black,
    fontWeight: '900',
  },
  joinedButtonText: {
    color: colors.success,
  },
  metaText: {
    color: colors.muted,
    fontWeight: '800',
  },
  successText: {
    color: colors.success,
    fontWeight: '800',
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
    fontWeight: '800',
    lineHeight: 20,
  },
  chatPanel: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  chatTitleCopy: {
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    minHeight: 130,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  messageBubble: {
    maxWidth: '88%',
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    padding: 10,
    gap: 3,
  },
  messageBubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primarySoft,
  },
  messageSender: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  messageBody: {
    color: colors.text,
    fontWeight: '700',
    lineHeight: 19,
  },
  messageComposer: {
    minHeight: 46,
    flexDirection: 'row',
    gap: 8,
  },
  messageInput: {
    flex: 1,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    color: colors.text,
    paddingHorizontal: 12,
    fontWeight: '800',
  },
  sendButton: {
    width: 46,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
