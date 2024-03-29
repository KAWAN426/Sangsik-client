import { Editor } from '@toast-ui/react-editor';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface Props {
  state: string;
  setState: Dispatch<SetStateAction<string>>;
}

export default function TextEditor({ state, setState }: Props) {
  const editorRef = useRef<Editor>(null);
  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || ''
  const [contents, setContents] = useState(' ');

  const uploadImage = async (file: File) => {
    if (!file) {
      alert("파일이 선택되지 않았습니다. 다시 시도해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(`${serverURL}/api/image/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.url as String;
    } catch (error) {
      console.error('Error uploading image: ', error);
      return;
    }
  };

  const onChange = () => {
    const editor = editorRef.current?.getInstance();
    if (!editor) return;
    let htmlText = editor.getHTML();
    if (!htmlText || htmlText === '<p><br></p>') return;

    let cleanedText = htmlText;
    cleanedText = cleanedText.replace(/<[\/]?span[^>]*>/g, "");
    if (cleanedText !== htmlText) editor.setHTML(cleanedText);

    setContents(cleanedText);
    setState(cleanedText);
    localStorage.setItem('editorData', cleanedText);
  };

  const imageSetting = () => {
    editorRef.current?.getRootElement().querySelectorAll('img').forEach((e) => {
      e.addEventListener('click', () => {
        console.log('click!')
      })
    })
  }

  useEffect(() => {
    const editor = editorRef.current?.getInstance();
    if (!editor) return;
    const editorData = localStorage.getItem('editorData')
    editor.setHTML(editorData || state)

    imageSetting();

    editor
      .addHook('addImageBlobHook', async (blob: File, callback: any) => {
        const result = await uploadImage(blob);
        if (!result) {
          alert('이미지 업로드에 실패했습니다.')
          return false;
        }
        callback(result, blob.name);
        return false;
      });
    return () => {
      editor.removeHook("addImageBlobHook");
    };
  }, [editorRef])

  return (
    <Editor
      initialValue={contents}
      previewStyle="vertical"
      hideModeSwitch={true}
      height="70vh"
      initialEditType="wysiwyg"
      useCommandShortcut={true}
      usageStatistics={true}
      // plugins={[colorSyntax]}
      // language="ko-KR"
      toolbarItems={[
        ['heading', 'bold', 'italic', 'strike'],
        ['hr', 'quote'],
        ['ul', 'ol', 'task'],
        ['table', 'image', 'link'],
        // ['code', 'codeblock'],
        ['scrollSync'],
      ]}
      ref={editorRef}
      onChange={onChange}
    />
  )
}