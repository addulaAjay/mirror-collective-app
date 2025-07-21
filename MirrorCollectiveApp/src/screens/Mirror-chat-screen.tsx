import React, { useRef, useState } from 'react'
import {
    View,
    Text,
    ImageBackground,
    StyleSheet,
    StatusBar,
    SafeAreaView,
    Platform,
    Dimensions,
    ScrollView,
    TextInput,
    TouchableOpacity,
} from 'react-native'
import LogoHeader from '../components/LogoHeader';


const { width, height } = Dimensions.get('window');
const HOST = Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000';

type Message = { id: string; text: string; sender: 'user' | 'system' }

export default function MirrorChatScreen() {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: 'The Mirror reflects…', sender: 'system' },
    ])
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const send = async () => {
        const text = draft.trim();
        if (!text) return;

        // 1) Optimistically add the user’s message locally
        setMessages((msgs) => [
            ...msgs,
            { id: String(msgs.length + 1), text, sender: 'user' },
        ]);
        setDraft('');
        setLoading(true);

        // 2) Build the conversationHistory payload
        const conversationHistory = messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'system',
            content: m.text,
        }));

        try {
            // 3) Send message + history to your API
            const res = await fetch(`${HOST}/api/mirror-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    conversationHistory,
                }),
            });
            const json = await res.json();

            // 4) Append the AI’s reply
            if (json.success && json.data?.reply) {
                setMessages((msgs) => [
                    ...msgs,
                    { id: String(msgs.length + 1), text: json.data.reply, sender: 'system' },
                ]);
            } else {
                // fallback error‐bubble
                setMessages((msgs) => [
                    ...msgs,
                    {
                        id: String(msgs.length + 1),
                        text: '❗️ Unexpected response from the server.',
                        sender: 'system',
                    },
                ]);
            }
        } catch (err) {
            console.error(err);
            setMessages((msgs) => [
                ...msgs,
                {
                    id: String(msgs.length + 1),
                    text: '❗️ Network error, please try again.',
                    sender: 'system',
                },
            ]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
            />

            <ImageBackground
                source={require('../../assets/dark_mode_shimmer_bg.png')}
                style={styles.background}
                resizeMode="cover"
            >
                <LogoHeader />

                {/* Chat “card” */}
                <View style={styles.chatContainer}>
                    <Text style={styles.chatTitle}>MirrorGPT</Text>

                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesWrapper}
                        contentContainerStyle={styles.messagesContent}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() =>
                            scrollViewRef.current?.scrollToEnd({ animated: true })
                        }
                    >
                        {messages.map(m =>
                            m.sender === 'user' ? (
                                <View key={m.id} style={styles.userBubble}>
                                    <Text style={styles.userText}>{m.text}</Text>
                                </View>
                            ) : (
                                <View key={m.id} style={styles.systemBubble}>
                                    <Text style={styles.systemText}>{m.text}</Text>
                                </View>
                            )
                        )}
                        {loading && (
                            <Text style={styles.loadingText}>…thinking…</Text>
                        )}
                    </ScrollView>

                    <View style={styles.inputRow}>
                        <TouchableOpacity style={styles.iconButton}>
                            <Text style={styles.iconText}>＋</Text>
                        </TouchableOpacity>
                        <TextInput
                            style={styles.input}
                            value={draft}
                            onChangeText={setDraft}
                            placeholder="Ask me something"
                            placeholderTextColor="rgba(255,255,255,0.6)"
                            editable={!loading}
                        />
                        <TouchableOpacity onPress={send} style={styles.sendButton} disabled={loading}>
                            <Text style={styles.sendText}>➤</Text>
                        </TouchableOpacity>
                    </View>
                </View>


                <View style={styles.footer}>
                    <Text style={styles.footerText}>What are you grateful for today?</Text>
                </View>
            </ImageBackground>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },

    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    footer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    headerText: {
        color: '#b5a674ff',
        fontSize: 18,
        marginBottom: 4,
        textAlign: 'center',
    },
    footerText: {
        fontStyle: 'italic',
        color: '#b5a674ff',
        fontSize: 18,
        marginBottom: 4,
        paddingTop: 12,
        textAlign: 'center',
    },
    chatContainer: {
        width: width - 32,
        height: height * 0.75,
        backgroundColor: 'rgba(55, 55, 53, 0.4)',
        borderRadius: 20,
        marginTop: 110,
        padding: 16,
        alignSelf: 'center',
        justifyContent: 'space-between',
    },
    chatTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        textDecorationLine: 'underline',
        marginBottom: 12,
    },

    messages: {
        flex: 1,
    },
    messagesWrapper: {
        flex: 1,
    },
    messagesContent: {
        flexGrow: 1,
        justifyContent: 'flex-end',
        paddingVertical: 8,
    },
    userBubble: {
        backgroundColor: '#d8c278ff',
        alignSelf: 'flex-end',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 16,
        marginVertical: 4,
        maxWidth: '80%',
    },
    userText: {
        color: '#000',
        fontSize: 16,
        lineHeight: 22,
    },
    systemBubble: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'flex-start',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 16,
        marginVertical: 4,
        maxWidth: '80%',
    },
    systemText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 22,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginTop: 12,
    },
    iconButton: {
        padding: 4,
    },
    iconText: {
        color: '#fff',
        fontSize: 20,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        marginHorizontal: 8,
    },
    sendButton: {
        padding: 4,
    },
    sendText: {
        color: '#fff',
        fontSize: 18,
    },
    loadingText: {
        color: '#ccc',
        fontStyle: 'italic',
        marginVertical: 4,
        alignSelf: 'center',
    },
})
